import Modal from './Modal'

export default function ConfirmDialog({ title, body, confirmLabel, onConfirm, onClose }) {
  return (
    <Modal title={title} description={body} onClose={onClose}>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={() => { onConfirm(); onClose() }} autoFocus>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
