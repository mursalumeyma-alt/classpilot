import { useState } from 'react'
import { ChevLeft, ChevRight } from '../ui/Icon'

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function Calendar() {
  const [cursor, setCursor] = useState(() => new Date())

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const dayCount = new Date(year, month + 1, 0).getDate()

  const now = new Date()
  const showsToday = now.getFullYear() === year && now.getMonth() === month

  const shift = (n) => setCursor(new Date(year, month + n, 1))

  return (
    <section className="card">
      <div className="cal-head">
        <b>{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</b>
        <div className="cal-nav">
          <button onClick={() => shift(-1)} aria-label="Previous month"><ChevLeft size={20} /></button>
          <button onClick={() => shift(1)} aria-label="Next month"><ChevRight size={20} /></button>
        </div>
      </div>
      <div className="cal">
        {DOW.map((d, i) => <div className="dow" key={i}>{d}</div>)}
        {Array.from({ length: firstWeekday }, (_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: dayCount }, (_, i) => {
          const day = i + 1
          const isToday = showsToday && now.getDate() === day
          return <div className={`day ${isToday ? 'today' : ''}`} key={day}>{day}</div>
        })}
      </div>
    </section>
  )
}
