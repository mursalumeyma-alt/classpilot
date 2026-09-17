/**
 * Inline icon set. Kept local so the app ships with zero icon dependencies
 * and every glyph inherits currentColor.
 */
const Svg = ({ size = 22, children, fill = 'none', ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={fill === 'none' ? 'currentColor' : 'none'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
)

export const Cap = (p) => (
  <Svg {...p}><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></Svg>
)
export const Spark = ({ size = 16 }) => (
  <Svg size={size} fill="#fff"><path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2Z" /></Svg>
)
export const Home = (p) => (
  <Svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></Svg>
)
export const Users = (p) => (
  <Svg {...p}><path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3.2" /><path d="M22 20v-2a4 4 0 0 0-3-3.8" /><path d="M16 3.3a4 4 0 0 1 0 7.4" /></Svg>
)
export const Book = (p) => (
  <Svg {...p}><path d="M2 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2Z" /><path d="M22 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22Z" /></Svg>
)
export const Chat = (p) => (
  <Svg {...p}><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" /></Svg>
)
export const Gear = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7.5l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.7V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3Z" /></Svg>
)
export const User = (p) => (
  <Svg {...p}><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></Svg>
)
export const SignOut = (p) => (
  <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></Svg>
)
export const Bell = (p) => (
  <Svg {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></Svg>
)
export const Mail = (p) => (
  <Svg {...p}><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 7 9 6 9-6" /></Svg>
)
export const Lock = (p) => (
  <Svg {...p}><rect x="4" y="10" width="16" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Svg>
)
export const Eye = (p) => (
  <Svg {...p}><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" /><circle cx="12" cy="12" r="2.8" /></Svg>
)
export const EyeOff = (p) => (
  <Svg {...p}><path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9" /><path d="M6.3 7.9A16.6 16.6 0 0 0 2 12s3.6 6 10 6a9.7 9.7 0 0 0 4-.8" /><path d="m3 3 18 18" /></Svg>
)
export const Search = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></Svg>
)
export const Plus = (p) => (
  <Svg strokeWidth="2.4" {...p}><path d="M12 5v14M5 12h14" /></Svg>
)
export const Pencil = (p) => (
  <Svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7.5 18.5 3 20l1.5-4.5Z" /></Svg>
)
export const Trash = (p) => (
  <Svg {...p}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" /><path d="M10 11v6M14 11v6" /></Svg>
)
export const Calendar = (p) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /></Svg>
)
export const Clock = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
)
export const Alert = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.01" /></Svg>
)
export const Trend = (p) => (
  <Svg {...p}><path d="m3 16 6-6 4 4 8-8" /><path d="M15 6h6v6" /></Svg>
)
export const Shield = (p) => (
  <Svg {...p}><path d="M12 3 4.5 6v6c0 4.6 3.1 7.9 7.5 9 4.4-1.1 7.5-4.4 7.5-9V6Z" /></Svg>
)
export const Camera = (p) => (
  <Svg {...p}><path d="M4 8h3l1.6-2.4h6.8L17 8h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" /><circle cx="12" cy="13.5" r="3.4" /></Svg>
)
export const ChevLeft = (p) => <Svg {...p}><path d="m14 6-6 6 6 6" /></Svg>
export const ChevRight = (p) => <Svg {...p}><path d="m10 6 6 6-6 6" /></Svg>
export const ChevDown = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
export const Arrow = (p) => <Svg {...p}><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></Svg>
export const Menu = (p) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>
export const Send = (p) => (
  <Svg {...p}><path d="M21 3 10.5 13.5" /><path d="M21 3 14.5 21l-4-7.5L3 9.5Z" /></Svg>
)
