import React, { useState, useCallback } from 'react'
import axios from 'axios'
import Header from './components/Header'
import ControlPanel from './components/ControlPanel'
import ForecastChart from './components/ForecastChart'
import StatsBar from './components/StatsBar'
import './index.css'

const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : 'https://weather-forcast-reint.onrender.com/api'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chartData, setChartData] = useState(null) // null = never loaded

  const handleFetch = useCallback(async ({ start, end, horizon }) => {
    setLoading(true)
    setError(null)
    try {
      const resp = await axios.get(`${API_BASE_URL}/chart-data`, {
        params: { start, end, horizon },
      })
      setChartData(resp.data)
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'An unexpected error occurred.'
      setError(msg)
      setChartData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="app-root">
      <Header />

      <main className="app-main">
        <ControlPanel onFetch={handleFetch} loading={loading} />

        {/* Stats bar — show as soon as data is ready */}
        {chartData && (
          <StatsBar
            metrics={chartData.metrics}
            actualsCount={chartData.actuals?.length}
            forecastsCount={chartData.forecasts?.length}
          />
        )}

        <ForecastChart
          actuals={chartData?.actuals}
          forecasts={chartData?.forecasts}
          loading={loading}
          error={error}
          hasData={chartData !== null}
        />

        {/* Footer note */}
        <p className="footer-note">
          Data source: Elexon BMRS API · Actuals: FUELHH (30-min) · Forecasts: WINDFOR (hourly) · January 2024 only
        </p>
      </main>

      <style>{`
        .app-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .app-main {
          flex: 1;
          padding: 0 24px 40px;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }
        /* Make children span full width */
        .app-main > * {
          max-width: 100%;
        }
        .footer-note {
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 8px;
          padding: 16px 0;
          border-top: 1px solid var(--border);
        }
        @media (max-width: 600px) {
          .app-main { padding: 0 12px 32px; }
        }
      `}</style>
    </div>
  )
}
