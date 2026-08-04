/**
 * Γενική κάρτα με προαιρετικό header + action.
 * Props:
 *  - title: string — τίτλος στο header
 *  - action: JSX — κουμπί/στοιχείο δεξιά στο header
 *  - children: το body
 *  - noBody: αν true, δεν τυλίγει σε card-body (για custom layout)
 *  - style: extra style στο container
 */
function Card({ title, action, children, noBody = false, style }) {
  return (
    <div className="card" style={style}>
      {(title || action) && (
        <div className="card-header">
          {title && <span className="card-title">{title}</span>}
          {action}
        </div>
      )}
      {noBody ? children : <div className="card-body">{children}</div>}
    </div>
  )
}

export default Card
