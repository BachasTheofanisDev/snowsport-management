/**
 * Μήνυμα "άδειας κατάστασης".
 * Props:
 *  - icon: emoji (προαιρετικό)
 *  - children/text: το μήνυμα
 *  - center: αν true κεντράρει με padding
 */
function EmptyState({ icon, children, center = false }) {
  if (center) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
        {icon && <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>}
        <p style={{ fontSize: 13 }}>{children}</p>
      </div>
    )
  }
  return (
    <p className="dash-muted" style={{ fontSize: 13 }}>
      {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
      {children}
    </p>
  )
}

export default EmptyState
