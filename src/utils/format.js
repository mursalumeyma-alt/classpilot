export const uid = () => Math.random().toString(36).slice(2, 10)
export const todayISO = () => new Date().toISOString().slice(0, 10)

export const fdate = (d) => {
  if (!d) return '—'
  const x = new Date(d.length === 10 ? d + 'T00:00:00' : d)
  return isNaN(x) ? d : x.toLocaleDateString('en-US')
}

export const ftime = (d) => {
  const x = new Date(d)
  if (isNaN(x)) return d
  return `${x.toLocaleDateString('en-US')} at ${x.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
}

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

export const firstName = (name = '') => name.split(' ')[0] || 'there'

export const timeAgo = (iso) => {
  const d = new Date(iso)
  if (isNaN(d)) return 'recently'
  const days = Math.floor((Date.now() - d) / 86400000)
  if (days < 1) return 'today'
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  const m = Math.floor(days / 30)
  return `${m} month${m > 1 ? 's' : ''} ago`
}
