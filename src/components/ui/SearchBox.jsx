import { Search } from './Icon'

export default function SearchBox({ value, onChange, placeholder, label }) {
  return (
    <div className="panel">
      <div className="searchbox">
        <span className="lead"><Search size={20} /></span>
        <input
          type="search"
          aria-label={label || placeholder}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
