function Menu({ title, open, onClose, mode = 'settings', children }) {
  const isMobile = typeof window !== 'undefined'
    && window.matchMedia('(max-width: 768px)').matches

  if (!open) return null

  return (
    <div className={`menu-backdrop ${isMobile ? 'mobile' : 'desktop'}`} onClick={onClose}>
      <div className={`menu-panel ${mode}`} onClick={(event) => event.stopPropagation()}>
        <div className="menu-header">
          <h3>{title}</h3>
          <button type="button" className="menu-close" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>
        <div className="menu-body">{children}</div>
      </div>
    </div>
  )
}

export default Menu
