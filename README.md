# UK Wind Power Forecast Monitor

A full-stack application for monitoring the accuracy of UK national-level wind power generation forecasts. Built with **React.js** (frontend) and **FastAPI** (backend), using live data from the [Elexon BMRS API](https://data.elexon.co.uk/bmrs/api/v1).

> **AI Disclosure**: This application was built with assistance from AI coding tools (Google Deepmind Antigravity / Gemini). AI was used to accelerate implementation of boilerplate, component structure, and API integration. All analytical thinking in the Jupyter notebooks is my own.

---

## Features

- 📅 **Date range picker** — Select any time window within January 2024
- 🎚️ **Forecast horizon slider** — Configure 0–48h horizon; shows the latest forecast published at least N hours before each target time
- 📈 **Interactive line chart** — Actual generation (blue) vs. Forecasted generation (green, dashed)
- 📊 **Error metrics** — Live MAE, RMSE, Mean Bias, P99 error computed per view
- 📱 **Responsive** — Works on desktop and mobile
- 🌑 **Dark glassmorphism UI** — Premium dark-mode design

---

## Project Structure

```
REint/
├── backend/                    # FastAPI backend
│   ├── main.py                 # All API endpoints + forecast logic
│   ├── requirements.txt        # Python dependencies
│   └── .venv/                  # (gitignored) Python virtual environment
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx      # App header with legend badges
│   │   │   ├── ControlPanel.jsx# Date pickers + horizon slider
│   │   │   ├── ForecastChart.jsx # Recharts line chart
│   │   │   └── StatsBar.jsx    # Error metric cards
│   │   ├── App.jsx             # Root component / state orchestrator
│   │   ├── index.css           # Full dark-mode design system
│   │   └── main.jsx            # React entry point
│   ├── index.html
│   ├── vite.config.js          # Vite + API proxy config
│   └── package.json
│
├── notebooks/                  # Jupyter analysis notebooks
│   ├── 01_forecast_error_analysis.ipynb
│   └── 02_reliability_analysis.ipynb
│
└── README.md
```

---

## How to Start the Application

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Start the Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
API docs (Swagger UI): `http://localhost:8000/docs`

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

> Both servers must be running simultaneously. The frontend proxies `/api/*` calls to the FastAPI backend automatically (configured in `vite.config.js`).

### 3. Running the Notebooks (Optional)

```bash
pip install jupyter pandas numpy matplotlib seaborn requests
jupyter notebook notebooks/
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/actuals` | Half-hourly actual wind generation |
| GET | `/api/forecasts` | Forecasts filtered by horizon |
| GET | `/api/chart-data` | Combined actuals + forecasts + metrics |
| GET | `/health` | Health check |

**Parameters**: `start`, `end` (ISO 8601 datetime), `horizon` (float, hours)

---

## Deployment

- **App link**: *(add Vercel/Heroku URL here after deployment)*
- **Demo video**: *(add YouTube link here)*

---

## Data Sources

| Dataset | Description | Granularity |
|---------|-------------|-------------|
| [`FUELHH`](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream) | Actual wind generation | 30 minutes |
| [`WINDFOR`](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream) | Forecasted wind generation | 1 hour |

Data is limited to **January 2024** as per assignment requirements.

---

## Analysis Notebooks

### `01_forecast_error_analysis.ipynb`
Analyses error characteristics of the WINDFOR model:
- Mean, median, P99 absolute error (overall and by horizon bucket)
- Error distribution plots and CDF
- Error by hour of day

### `02_reliability_analysis.ipynb`
Analyses historical actuals to recommend reliable wind capacity:
- Distribution analysis and percentile table
- Low-wind event identification
- **Recommendation**: P10 percentile as firm wind capacity baseline (~90% reliability)
