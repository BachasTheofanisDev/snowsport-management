import Modal from './Modal'

/**
 * Modal επιβεβαίωσης/επιτυχίας (π.χ. "Αποθηκεύτηκε!").
 * Props:
 *  - open, onClose
 *  - icon: emoji (default ✅)
 *  - title, message
 *  - buttonLabel (default 'Εντάξει')
 */
function ConfirmModal({ open, onClose, icon = '✅', title, message, buttonLabel = 'Εντάξει' }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div className="card-body" style={{ padding: '2rem' }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>{icon}</div>
          {title && <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>{title}</h3>}
          {message && <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
