/**
 * Γενικό modal wrapper.
 * Props:
 *  - open: boolean — αν φαίνεται
 *  - onClose: () => void — κλείσιμο (κλικ έξω ή στο ✕)
 *  - title: string — τίτλος στο header (προαιρετικό)
 *  - headerColor: 'navy' | string — χρώμα header (default navy)
 *  - maxWidth: number — πλάτος (default 480)
 *  - children: το περιεχόμενο του body
 *  - footer: προαιρετικό περιεχόμενο κάτω
 */
function Modal({ open, onClose, title, headerColor = 'var(--navy)', maxWidth = 480, children, footer }) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem'
      }}
      onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth, maxHeight: '88vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        {title && (
          <div className="card-header" style={{ background: headerColor, color: 'white', position: 'sticky', top: 0, zIndex: 1 }}>
            <span className="card-title" style={{ color: 'white' }}>{title}</span>
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
        )}
        <div className="card-body">
          {children}
        </div>
        {footer && <div style={{ padding: '0 1.25rem 1.25rem' }}>{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
