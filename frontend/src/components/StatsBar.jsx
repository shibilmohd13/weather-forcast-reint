import React from 'react'
import { TrendingUp, TrendingDown, Target, Activity, BarChart2 } from 'lucide-react'

function MetricCard({ label, value, unit, icon: Icon, colorClass, description }) {
    return (
        <div className="metric-card glass-card">
            <div className="metric-top">
                <div className={`metric-icon-wrap ${colorClass}`}>
                    <Icon size={16} strokeWidth={2} />
                </div>
                <span className="metric-label">{label}</span>
            </div>
            <div className="metric-value">
                {value != null ? (
                    <>
                        <span className="metric-number">{value.toLocaleString()}</span>
                        <span className="metric-unit"> {unit}</span>
                    </>
                ) : (
                    <span className="metric-na">—</span>
                )}
            </div>
            {description && <p className="metric-desc">{description}</p>}
        </div>
    )
}

export default function StatsBar({ metrics, actualsCount, forecastsCount }) {
    if (!metrics && actualsCount == null) return null

    const hasMet = metrics && Object.keys(metrics).length > 0

    return (
        <div className="stats-bar-wrapper">
            <div className="stats-grid">
                <MetricCard
                    label="Actuals"
                    value={actualsCount}
                    unit="points"
                    icon={Activity}
                    colorClass="icon-blue"
                    description="Half-hourly readings"
                />
                <MetricCard
                    label="Forecasts"
                    value={forecastsCount}
                    unit="points"
                    icon={BarChart2}
                    colorClass="icon-green"
                    description="Matched within horizon"
                />
                <MetricCard
                    label="MAE"
                    value={hasMet ? metrics.mae : null}
                    unit="MW"
                    icon={Target}
                    colorClass="icon-amber"
                    description="Mean absolute error"
                />
                <MetricCard
                    label="RMSE"
                    value={hasMet ? metrics.rmse : null}
                    unit="MW"
                    icon={TrendingUp}
                    colorClass="icon-amber"
                    description="Root mean squared error"
                />
                <MetricCard
                    label="Mean Bias"
                    value={hasMet ? metrics.mean_bias : null}
                    unit="MW"
                    icon={hasMet && metrics.mean_bias >= 0 ? TrendingUp : TrendingDown}
                    colorClass={hasMet && metrics.mean_bias >= 0 ? 'icon-green' : 'icon-red'}
                    description="Positive = over-forecast"
                />
                <MetricCard
                    label="P99 Error"
                    value={hasMet ? metrics.p99_abs_error : null}
                    unit="MW"
                    icon={TrendingUp}
                    colorClass="icon-red"
                    description="99th percentile abs error"
                />
            </div>

            <style>{`
        .stats-bar-wrapper {
          max-width: 1400px;
          margin: 0 auto 20px;
          padding: 0 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }
        @media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
        .metric-card {
          padding: 16px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-card);
        }
        .metric-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .metric-icon-wrap {
          width: 28px; height: 28px;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .icon-blue { background: rgba(56,189,248,0.15); color: var(--actual-color); }
        .icon-green { background: rgba(52,211,153,0.15); color: var(--forecast-color); }
        .icon-amber { background: rgba(251,191,36,0.15); color: #fbbf24; }
        .icon-red { background: rgba(239,68,68,0.15); color: #f87171; }
        .metric-label {
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-secondary);
        }
        .metric-value {
          display: flex;
          align-items: baseline;
          gap: 2px;
        }
        .metric-number {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }
        .metric-unit {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .metric-na { font-size: 1.4rem; color: var(--text-muted); }
        .metric-desc {
          font-size: 0.72rem;
          color: var(--text-muted);
          line-height: 1.3;
          margin-top: 2px;
        }
      `}</style>
        </div>
    )
}
