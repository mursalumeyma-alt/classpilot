export default function StatCard({ tone, icon, label, value, caption }) {
  return (
    <div className={`stat s-${tone}`}>
      <div className="si">{icon}</div>
      <div>
        <div className="sl">{label}</div>
        <div className="sv">{value}</div>
        <div className="sc">{caption}</div>
      </div>
    </div>
  )
}
