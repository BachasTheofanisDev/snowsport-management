/**
 * Μπάρα προόδου/πληρότητας.
 * Props:
 *  - value: τρέχουσα τιμή
 *  - max: μέγιστη τιμή
 *  - success: boolean — αν true πράσινη, αλλιώς πορτοκαλί (default βάσει reached)
 *  - height: ύψος σε px (default 8)
 *  - label: προαιρετικό κείμενο κάτω από τη μπάρα
 */
function ProgressBar({ value, max, success, height = 8, label }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const isSuccess = success != null ? success : pct >= 100
  const bg = isSuccess
    ? 'linear-gradient(90deg, #059669, #10b981)'
    : 'linear-gradient(90deg, #f59e0b, #fbbf24)'

  return (
    <div>
      <div style={{ height, background: 'var(--ice)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: bg, borderRadius: 100, transition: 'width 0.4s' }} />
      </div>
      {label && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>}
    </div>
  )
}

export default ProgressBar
