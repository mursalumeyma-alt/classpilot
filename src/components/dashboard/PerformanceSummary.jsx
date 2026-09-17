const RADIUS = 58
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function PerformanceSummary({ percent = 85 }) {
  return (
    <section className="card">
      <h4>Performance summary</h4>
      <div style={{ marginTop: 14 }}>
        <div className="perf"><span>Average grade</span><b>B+</b></div>
        <div className="perf"><span>Attendance rate</span><b>94%</b></div>
        <div className="perf"><span>Assignments completed</span><b>87%</b></div>
      </div>
      <div className="ring-wrap">
        <div className="ring">
          <svg viewBox="0 0 132 132" width="132" height="132" aria-hidden="true">
            <circle cx="66" cy="66" r={RADIUS} stroke="var(--line)" strokeWidth="9" fill="none" />
            <circle
              cx="66" cy="66" r={RADIUS} stroke="url(#ring-gradient)" strokeWidth="9" fill="none" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
            />
            <defs>
              <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ textAlign: 'center' }}>
            <b>{percent}%</b><br /><span>Overall</span>
          </div>
        </div>
      </div>
    </section>
  )
}
