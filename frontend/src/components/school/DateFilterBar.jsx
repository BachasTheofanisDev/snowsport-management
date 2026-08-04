/**
 * Μπάρα φίλτρου ημερομηνίας με κουμπί "Σήμερα".
 */
function DateFilterBar({ value, onChange }) {
  return (
    <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <label className="form-label" style={{ marginBottom: 0 }}>📅 Ημερομηνία:</label>
      <input className="form-input" type="date" value={value} onChange={e => onChange(e.target.value)} style={{ width: 'auto' }} />
      <button className="btn btn-sm" style={{ background: 'var(--ice)', color: 'var(--text-secondary)' }}
        onClick={() => onChange(new Date().toISOString().split('T')[0])}>Σήμερα</button>
    </div>
  )
}

export default DateFilterBar
