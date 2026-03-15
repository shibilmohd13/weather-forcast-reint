import React from 'react'
import { Wind, Zap } from 'lucide-react'

export default function Header() {
    return (
        <header className="app-header">
            <div className="header-inner">
                <div className="header-logo">
                    <div className="logo-icon">
                        <Wind size={22} strokeWidth={2.5} />
                    </div>
                    <div className="header-titles">
                        <h1 className="header-title">
                            UK Wind Power{' '}
                            <span className="gradient-text">Forecast Monitor</span>
                        </h1>
                        <p className="header-subtitle">
                            National grid wind generation · Actual vs Forecast · January 2024
                        </p>
                    </div>
                </div>

                <div className="header-badges">
                    <span className="badge badge-blue">
                        <span className="dot" style={{ background: 'var(--actual-color)' }} />
                        Actual
                    </span>
                    <span className="badge badge-green">
                        <span className="dot" style={{ background: 'var(--forecast-color)' }} />
                        Forecast
                    </span>
                    <span className="badge badge-amber">
                        <Zap size={11} />
                        Live API
                    </span>
                </div>
            </div>

            <style>{`
        .app-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid var(--border);
          background: rgba(8,9,14,0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .header-logo {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .logo-icon {
          width: 44px;
          height: 44px;
          background: var(--accent-gradient);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #08090e;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(56,189,248,0.3);
        }
        .header-title {
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .header-subtitle {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .header-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>
        </header>
    )
}
