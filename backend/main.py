"""
UK Wind Power Forecast Monitoring API
FastAPI backend that fetches data from the Elexon BMRS API and serves
processed actuals and forecasts to the React frontend.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional
from collections import defaultdict

import httpx
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="UK Wind Power Forecast Monitor API",
    description="Serves actual and forecasted UK national wind power generation data.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ELEXON_BASE = "https://data.elexon.co.uk/bmrs/api/v1"
# Max hours for which WINDFOR data is considered (0–48 hrs horizon)
MAX_HORIZON_HOURS = 48
# HTTP client timeout
HTTP_TIMEOUT = 60.0


def parse_dt(s: str) -> datetime:
    """Parse ISO datetime string to UTC-aware datetime."""
    dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


async def fetch_actuals(start: datetime, end: datetime) -> list[dict]:
    """
    Fetch half-hourly wind generation actuals from FUELHH endpoint.
    Returns list of {time: ISO str, generation: int}.
    """
    params = {
        "settlementDateFrom": start.date().isoformat(),
        "settlementDateTo": end.date().isoformat(),
        "fuelType": "WIND",
        "format": "json",
    }
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        resp = await client.get(f"{ELEXON_BASE}/datasets/FUELHH/stream", params=params)
        resp.raise_for_status()
        raw = resp.json()

    result = []
    for item in raw:
        t = parse_dt(item["startTime"])
        # Filter strictly within [start, end]
        if start <= t <= end:
            result.append({"time": item["startTime"], "generation": item["generation"]})

    # Sort ascending by time
    result.sort(key=lambda x: x["time"])
    return result


async def fetch_forecasts(start: datetime, end: datetime, horizon_hours: float) -> list[dict]:
    """
    Fetch wind forecasts from WINDFOR endpoint and apply the horizon filter.

    Logic: For each target startTime T in [start, end]:
      - Find all forecasts with publishTime <= T - horizon_hours
      - Pick the one with the latest publishTime (most recent valid forecast)
      - Only consider forecasts with horizon between 0 and 48 hrs

    Returns list of {time: ISO str, generation: int}.
    """
    # We need publishTime data far enough back.
    # Fetch a window: from (start - 48h) to end for publish time range.
    publish_from = start - timedelta(hours=MAX_HORIZON_HOURS)
    publish_to = end

    params = {
        "publishDateTimeFrom": publish_from.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "publishDateTimeTo": publish_to.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "format": "json",
    }

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        resp = await client.get(f"{ELEXON_BASE}/datasets/WINDFOR/stream", params=params)
        resp.raise_for_status()
        raw = resp.json()

    # Group forecasts by startTime
    # For each startTime, build list of (publishTime, generation)
    by_target: dict[str, list[tuple[datetime, int]]] = defaultdict(list)

    for item in raw:
        target_t = parse_dt(item["startTime"])
        publish_t = parse_dt(item["publishTime"])

        # Only include target times within our requested range
        if not (start <= target_t <= end):
            continue

        actual_horizon = (target_t - publish_t).total_seconds() / 3600.0
        # Only keep forecasts within valid horizon range
        if 0 <= actual_horizon <= MAX_HORIZON_HOURS:
            by_target[item["startTime"]].append((publish_t, item["generation"]))

    # For each target time, pick the latest publishTime with horizon >= requested horizon_hours
    result = []
    for target_str, forecasts in by_target.items():
        target_t = parse_dt(target_str)
        cutoff = target_t - timedelta(hours=horizon_hours)

        # Filter to forecasts published at or before cutoff
        valid = [(pub, gen) for pub, gen in forecasts if pub <= cutoff]
        if not valid:
            # No valid forecast for this horizon — skip (don't plot)
            continue

        # Pick the most recent valid forecast
        latest_pub, best_gen = max(valid, key=lambda x: x[0])
        result.append({"time": target_str, "generation": best_gen})

    result.sort(key=lambda x: x["time"])
    return result


@app.get("/api/actuals")
async def get_actuals(
    start: str = Query(..., description="Start datetime ISO 8601, e.g. 2024-01-01T00:00:00Z"),
    end: str = Query(..., description="End datetime ISO 8601, e.g. 2024-01-02T00:00:00Z"),
):
    """Return actual wind generation values between start and end."""
    try:
        start_dt = parse_dt(start)
        end_dt = parse_dt(end)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format: {e}")

    if start_dt >= end_dt:
        raise HTTPException(status_code=400, detail="start must be before end")

    data = await fetch_actuals(start_dt, end_dt)
    return {"data": data, "count": len(data)}


@app.get("/api/forecasts")
async def get_forecasts(
    start: str = Query(..., description="Start datetime ISO 8601"),
    end: str = Query(..., description="End datetime ISO 8601"),
    horizon: float = Query(4.0, ge=0, le=48, description="Forecast horizon in hours (0–48)"),
):
    """Return forecasted wind generation values with the given horizon filter."""
    try:
        start_dt = parse_dt(start)
        end_dt = parse_dt(end)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format: {e}")

    if start_dt >= end_dt:
        raise HTTPException(status_code=400, detail="start must be before end")

    data = await fetch_forecasts(start_dt, end_dt, horizon)
    return {"data": data, "count": len(data)}


@app.get("/api/chart-data")
async def get_chart_data(
    start: str = Query(..., description="Start datetime ISO 8601"),
    end: str = Query(..., description="End datetime ISO 8601"),
    horizon: float = Query(4.0, ge=0, le=48, description="Forecast horizon in hours (0–48)"),
):
    """
    Combined endpoint — returns both actuals and forecasts in one response.
    Also computes basic error metrics (MAE, RMSE, Mean Bias).
    """
    try:
        start_dt = parse_dt(start)
        end_dt = parse_dt(end)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format: {e}")

    if start_dt >= end_dt:
        raise HTTPException(status_code=400, detail="start must be before end")

    # Fetch both concurrently
    actuals, forecasts = await asyncio.gather(
        fetch_actuals(start_dt, end_dt),
        fetch_forecasts(start_dt, end_dt, horizon),
    )

    # Build lookup for quick join
    actual_map = {a["time"]: a["generation"] for a in actuals}
    forecast_map = {f["time"]: f["generation"] for f in forecasts}

    # Compute metrics on overlapping times
    errors = []
    for t, act in actual_map.items():
        if t in forecast_map:
            errors.append(forecast_map[t] - act)

    metrics = {}
    if errors:
        n = len(errors)
        mae = sum(abs(e) for e in errors) / n
        rmse = (sum(e ** 2 for e in errors) / n) ** 0.5
        bias = sum(errors) / n
        abs_errors_sorted = sorted(abs(e) for e in errors)
        p99_idx = max(0, int(0.99 * n) - 1)
        p99 = abs_errors_sorted[p99_idx]
        metrics = {
            "mae": round(mae, 1),
            "rmse": round(rmse, 1),
            "mean_bias": round(bias, 1),
            "p99_abs_error": round(p99, 1),
            "overlap_count": n,
        }

    return {
        "actuals": actuals,
        "forecasts": forecasts,
        "metrics": metrics,
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
