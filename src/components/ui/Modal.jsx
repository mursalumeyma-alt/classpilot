import { useEffect } from 'react'

export default function Modal({ title, description, onClose, children, labelledBy = 'modal-title' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <h4 id={labelledBy}>{title}</h4>
        {description && <p className="mdesc">{description}</p>}
        {children}
      </div>
    </div>
  )
}
