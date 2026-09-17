import { useEffect, useRef, useState } from 'react'
import { useData } from '../context/DataContext'
import { initials } from '../utils/format'
import EmptyState from '../components/ui/EmptyState'
import { Chat, Send } from '../components/ui/Icon'

export default function Messages() {
  const { threads, sendMessage } = useData()
  const [activeId, setActiveId] = useState(threads[0]?.id)
  const [draft, setDraft] = useState('')
  const bubblesRef = useRef(null)

  const active = threads.find((t) => t.id === activeId) || threads[0]

  useEffect(() => {
    if (bubblesRef.current) bubblesRef.current.scrollTop = bubblesRef.current.scrollHeight
  }, [active?.msgs.length, activeId])

  if (threads.length === 0) {
    return (
      <>
        <div className="page-head">
          <div className="grow"><h3>Messages</h3><p>Keep parents and co-teachers in the loop</p></div>
        </div>
        <EmptyState icon={<Chat size={30} />} title="No conversations" body="Messages from parents and colleagues will appear here." />
      </>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!draft.trim()) return
    const text = draft.trim()
    setDraft('')
    try { await sendMessage(active.id, text) } catch { setDraft(text) }
  }

  return (
    <>
      <div className="page-head">
        <div className="grow"><h3>Messages</h3><p>Keep parents and co-teachers in the loop</p></div>
      </div>

      <div className="msg-grid">
        <div className="card" style={{ padding: 14 }}>
          {threads.map((t) => (
            <button key={t.id} className={`thread ${t.id === active.id ? 'on' : ''}`} onClick={() => setActiveId(t.id)}>
              <span className="avatar">{initials(t.who)}</span>
              <span className="grow">
                <b>{t.who}</b>
                <p>{t.msgs[t.msgs.length - 1]?.text || t.role}</p>
              </span>
            </button>
          ))}
        </div>

        <div className="card">
          <div className="head-row">
            <div>
              <h4>{active.who}</h4>
              <p style={{ margin: '2px 0 0', color: 'var(--muted)' }}>{active.role}</p>
            </div>
          </div>

          <div className="bubbles" ref={bubblesRef}>
            {active.msgs.map((m, i) => (
              <div className={`bub ${m.from === 'me' ? 'me' : 'them'}`} key={i}>{m.text}</div>
            ))}
          </div>

          <form className="composer" onSubmit={submit}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message" aria-label="Message" autoComplete="off" />
            <button className="btn btn-primary" type="submit"><Send size={20} /> Send</button>
          </form>
        </div>
      </div>
    </>
  )
}
