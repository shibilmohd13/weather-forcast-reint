import React, { useState, useCallback } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Sliders, Search } from 'lucide-react'

const MIN_DATE = new Date('2024-01-01T00:00:00Z')
const MAX_DATE = new Date('2024-01-31T23:30:00Z')
const DEFAULT_START = new Date('2024-01-01T08:00:00Z')
const DEFAULT_END = new Date('2024-01-02T08:00:00Z')

export default function ControlPanel({ onFetch, loading }) {
    const [startDate, setStartDate] = useState(DEFAULT_START)
    const [endDate, setEndDate] = useState(DEFAULT_END)
    const [horizon, setHorizon] = useState(4)

    const sliderPct = ((horizon / 48) * 100).toFixed(2)

    const handleFetch = useCallback(() => {
        onFetch({
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            horizon,
        })
    }, [startDate, endDate, horizon, onFetch])

    const handleHorizonChange = (e) => {
        setHorizon(Number(e.target.value))
        e.target.style.setProperty('--slider-pct', `${(Number(e.target.value) / 48) * 100}%`)
    }

    return (
        <div className="control-panel glass-card">
            <div className="control-panel-inner">
                {/* Date Range */}
                <div className="control-group">
                    <label className="form-label">
                        <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                        Start Time (UTC)
                    </label>
                    <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        showTimeSelect
                        timeIntervals={30}
                        dateFormat="dd/MM/yyyy HH:mm"
                        timeFormat="HH:mm"
                        minDate={MIN_DATE}
                        maxDate={endDate}
                        placeholderText="Select start..."
                    />
                </div>

                <div className="control-group">
                    <label className="form-label">
                        <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                        End Time (UTC)
                    </label>
                    <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        showTimeSelect
                        timeIntervals={30}
                        dateFormat="dd/MM/yyyy HH:mm"
                        timeFormat="HH:mm"
                        minDate={startDate}
                        maxDate={MAX_DATE}
                        placeholderText="Select end..."
                    />
                </div>

                {/* Horizon Slider */}
                <div className="control-group horizon-group">
                    <label className="form-label">
                        <Sliders size={12} style={{ display: 'inline', marginRight: 4 }} />
                        Forecast Horizon
                    </label>
                    <div className="slider-row">
                        <input
                            type="range"
                            min="0"
                            max="48"
                            step="0.5"
                            value={horizon}
                            onChange={handleHorizonChange}
                            className="slider"
                            style={{ '--slider-pct': `${sliderPct}%` }}
                        />
                        <span className="horizon-value">{horizon}h</span>
                    </div>
                    <p className="horizon-hint">
                        Showing latest forecast published ≥ {horizon}h before each target time
                    </p>
                </div>

                {/* Fetch Button */}
                <div className="control-group btn-group">
                    <button className="btn-primary" onClick={handleFetch} disabled={loading}>
                        {loading ? (
                            <>
                                <div className="mini-spinner" />
                                Loading…
                            </>
                        ) : (
                            <>
                                <Search size={15} />
                                Load Data
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
        .control-panel {
          margin: 20px auto;
          max-width: 1400px;
          padding: 20px 24px;
        }
        .control-panel-inner {
          display: grid;
          grid-template-columns: 1fr 1fr 2fr auto;
          gap: 20px;
          align-items: end;
        }
        @media (max-width: 900px) {
          .control-panel-inner {
            grid-template-columns: 1fr 1fr;
          }
          .btn-group { grid-column: 1 / -1; }
        }
        @media (max-width: 600px) {
          .control-panel-inner { grid-template-columns: 1fr; }
          .horizon-group { grid-column: 1; }
        }
        .control-group { display: flex; flex-direction: column; gap: 6px; }
        .slider-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .horizon-value {
          font-size: 1rem;
          font-weight: 700;
          color: var(--actual-color);
          min-width: 38px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .horizon-hint {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 2px;
          line-height: 1.4;
        }
        .btn-group { justify-content: flex-end; align-items: flex-end; }
        .mini-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(0,0,0,0.3);
          border-top-color: #0f1117;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
      `}</style>
        </div>
    )
}
