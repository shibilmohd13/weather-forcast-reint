import React, { useMemo } from 'react'
import {
    ResponsiveContainer,
    ComposedChart,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
} from 'recharts'
import { format, parseISO } from 'date-fns'

const ACTUAL_COLOR = '#38bdf8'
const FORECAST_COLOR = '#34d399'

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null

    const actual = payload.find((p) => p.dataKey === 'actual')
    const forecast = payload.find((p) => p.dataKey === 'forecast')

    let diff = null
    if (actual?.value != null && forecast?.value != null) {
        diff = forecast.value - actual.value
    }

    let dateLabel = label
    try {
        dateLabel = format(parseISO(label), 'dd MMM HH:mm')
    } catch { }

    return (
        <div className="chart-tooltip">
            <p className="tooltip-time">{dateLabel}</p>
            {actual?.value != null && (
                <div className="tooltip-row">
                    <span className="tooltip-dot" style={{ background: ACTUAL_COLOR }} />
                    <span>Actual</span>
                    <span className="tooltip-val">{actual.value.toLocaleString()} MW</span>
                </div>
            )}
            {forecast?.value != null && (
                <div className="tooltip-row">
                    <span className="tooltip-dot" style={{ background: FORECAST_COLOR }} />
                    <span>Forecast</span>
                    <span className="tooltip-val">{forecast.value.toLocaleString()} MW</span>
                </div>
            )}
            {diff != null && (
                <div className="tooltip-divider" />
            )}
            {diff != null && (
                <div className="tooltip-row">
                    <span>Error</span>
                    <span
                        className="tooltip-val"
                        style={{ color: diff >= 0 ? FORECAST_COLOR : '#f87171' }}
                    >
                        {diff >= 0 ? '+' : ''}{diff.toLocaleString()} MW
                    </span>
                </div>
            )}
            <style>{`
        .chart-tooltip {
          background: rgba(15,17,23,0.96);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 12px 16px;
          min-width: 190px;
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .tooltip-time {
          font-size: 0.78rem;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .tooltip-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 5px 0;
          font-size: 0.85rem;
          color: #e2e8f0;
        }
        .tooltip-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .tooltip-val {
          margin-left: auto;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
        .tooltip-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 8px 0 4px;
        }
      `}</style>
        </div>
    )
}

function CustomLegend() {
    return (
        <div className="chart-legend">
            <div className="legend-item">
                <svg width="24" height="3"><line x1="0" y1="1.5" x2="24" y2="1.5" stroke={ACTUAL_COLOR} strokeWidth="2.5" /></svg>
                <span>Actual Generation</span>
            </div>
            <div className="legend-item">
                <svg width="24" height="3"><line x1="0" y1="1.5" x2="24" y2="1.5" stroke={FORECAST_COLOR} strokeWidth="2.5" strokeDasharray="6 3" /></svg>
                <span>Forecasted Generation</span>
            </div>
            <style>{`
        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 24px;
          padding: 8px 0 0;
          flex-wrap: wrap;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: #94a3b8;
          font-weight: 500;
        }
      `}</style>
        </div>
    )
}

// Tick formatter for X-axis
function formatTick(isoStr) {
    try {
        return format(parseISO(isoStr), 'HH:mm\ndd/MM')
    } catch {
        return isoStr
    }
}

export default function ForecastChart({ actuals, forecasts, loading, error, hasData }) {
    // Merge actuals and forecasts into a single array keyed by time
    const chartData = useMemo(() => {
        if (!actuals?.length && !forecasts?.length) return []

        const map = {}
        actuals?.forEach(({ time, generation }) => {
            map[time] = { time, actual: generation }
        })
        forecasts?.forEach(({ time, generation }) => {
            if (map[time]) {
                map[time].forecast = generation
            } else {
                map[time] = { time, forecast: generation }
            }
        })
        return Object.values(map).sort((a, b) => a.time.localeCompare(b.time))
    }, [actuals, forecasts])

    // X-axis ticks — pick a subset to avoid crowding
    const tickCount = Math.min(chartData.length, 12)
    const tickIndices = useMemo(() => {
        if (chartData.length <= tickCount) return chartData.map((_, i) => i)
        const step = Math.floor(chartData.length / tickCount)
        return Array.from({ length: tickCount }, (_, i) => i * step)
    }, [chartData, tickCount])
    const ticks = tickIndices.map((i) => chartData[i]?.time).filter(Boolean)

    if (loading) {
        return (
            <div className="chart-shell glass-card chart-loading">
                <div className="spinner" />
                <p className="text-muted" style={{ marginTop: 16 }}>Fetching data from Elexon BMRS…</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="chart-shell glass-card chart-empty">
                <div className="empty-icon">⚠️</div>
                <p className="empty-title">Failed to load data</p>
                <p className="text-muted text-sm">{error}</p>
            </div>
        )
    }

    if (!hasData) {
        return (
            <div className="chart-shell glass-card chart-empty">
                <div className="empty-icon">📊</div>
                <p className="empty-title">Select a time range and click "Load Data"</p>
                <p className="text-muted text-sm">
                    Data available for January 2024 · Wind power generation (MW)
                </p>
            </div>
        )
    }

    if (chartData.length === 0) {
        return (
            <div className="chart-shell glass-card chart-empty">
                <div className="empty-icon">🔍</div>
                <p className="empty-title">No data for this range</p>
                <p className="text-muted text-sm">Try a different date range or reduce the horizon.</p>
            </div>
        )
    }

    // Y-axis domain with some padding
    const allVals = chartData.flatMap(d => [d.actual, d.forecast].filter(v => v != null))
    const minVal = Math.min(...allVals)
    const maxVal = Math.max(...allVals)
    const pad = (maxVal - minVal) * 0.08
    const yDomain = [Math.max(0, Math.floor((minVal - pad) / 500) * 500), Math.ceil((maxVal + pad) / 500) * 500]

    return (
        <div className="chart-shell glass-card">
            <div className="chart-header">
                <div>
                    <h2 className="chart-title">Wind Power Generation</h2>
                    <p className="chart-subtitle">National UK grid · MW (half-hourly actuals, hourly forecasts)</p>
                </div>
                <span className="chart-points">{chartData.length} time points</span>
            </div>

            <div className="chart-area">
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={chartData} margin={{ top: 10, right: 24, left: 16, bottom: 10 }}>
                        <defs>
                            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={ACTUAL_COLOR} stopOpacity={0.15} />
                                <stop offset="95%" stopColor={ACTUAL_COLOR} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.05)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="time"
                            ticks={ticks}
                            tickFormatter={formatTick}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                            tickLine={false}
                            label={{
                                value: 'Target Time (UTC)',
                                position: 'insideBottom',
                                offset: -4,
                                fill: '#64748b',
                                fontSize: 12,
                            }}
                            height={52}
                        />
                        <YAxis
                            domain={yDomain}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            label={{
                                value: 'Power (MW)',
                                angle: -90,
                                position: 'insideLeft',
                                offset: 8,
                                fill: '#64748b',
                                fontSize: 12,
                            }}
                            width={52}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke={ACTUAL_COLOR}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5, fill: ACTUAL_COLOR, strokeWidth: 0 }}
                            connectNulls={false}
                            name="Actual"
                        />
                        <Line
                            type="monotone"
                            dataKey="forecast"
                            stroke={FORECAST_COLOR}
                            strokeWidth={2.5}
                            strokeDasharray="8 4"
                            dot={false}
                            activeDot={{ r: 5, fill: FORECAST_COLOR, strokeWidth: 0 }}
                            connectNulls={false}
                            name="Forecast"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <CustomLegend />

            <style>{`
        .chart-shell {
          max-width: 1400px;
          margin: 0 auto 20px;
          padding: 24px;
        }
        .chart-loading, .chart-empty {
          height: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .empty-icon { font-size: 2.5rem; margin-bottom: 8px; }
        .empty-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); }
        .chart-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chart-title { font-size: 1.1rem; font-weight: 700; }
        .chart-subtitle { font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px; }
        .chart-points { font-size: 0.75rem; color: var(--text-muted); background: rgba(255,255,255,0.04); padding: 4px 10px; border-radius: 999px; border: 1px solid var(--border); }
        .chart-area { margin: 0 -8px; }
      `}</style>
        </div>
    )
}
