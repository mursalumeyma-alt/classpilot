import { Plus } from './Icon'

export default function EmptyState({ icon, title, body, actionLabel, onAction }) {
  return (
    <div className="empty">
      <div className="ei">{icon}</div>
      <b>{title}</b>
      <p>{body}</p>
      {actionLabel && (
        <button className="btn btn-primary" onClick={onAction}>
          <Plus size={20} /> {actionLabel}
        </button>
      )}
    </div>
  )
}
