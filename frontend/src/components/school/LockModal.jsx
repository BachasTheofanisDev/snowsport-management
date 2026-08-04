import Modal from '../ui/Modal'
import FormField from '../ui/FormField'
import { LEVEL_LABEL, SPORT_ICON } from './constants'

/**
 * Modal κλειδώματος ανοιχτού ομαδικού: μπάρες προτίμησης ωρών + επιλογή εκπαιδευτή.
 */
function LockModal({ lesson, form, onFormChange, error, instructors, onSubmit, onClose }) {
  const getHourStats = () => {
    const activeBookings = lesson?.bookings?.filter(b => b.status !== 'cancelled') || []
    const total = activeBookings.length
    const stats = {}
    for (let h = 9; h <= 15; h++) {
      stats[h] = { count: activeBookings.filter(b => (b.preferredHours || []).includes(h)).length, total }
    }
    return stats
  }

  return (
    <Modal open={!!lesson} onClose={onClose} title="🔒 Κλείδωμα Ομαδικού" maxWidth={560}>
      {lesson && (() => {
        const hourStats = getHourStats()
        const maxStart = 16 - lesson.duration
        const validHours = []
        for (let h = 9; h <= maxStart; h++) validHours.push(h)
        return (
          <>
            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ background: 'var(--ice)', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: 13 }}>
              <div style={{ fontWeight: 600 }}>{SPORT_ICON[lesson.sport]} {lesson.duration} ώρ. — {LEVEL_LABEL[lesson.level]}</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>📅 {new Date(lesson.date).toLocaleDateString('el-GR')} • 👥 {lesson.bookings?.filter(b => b.status !== 'cancelled').length || 0} συμμετέχοντες</div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📊 Προτιμήσεις ωρών συμμετεχόντων</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {validHours.map(h => {
                  const stat = hourStats[h] || { count: 0, total: 0 }
                  const pct = stat.total > 0 ? (stat.count / stat.total) * 100 : 0
                  const timeStr = `${h.toString().padStart(2, '0')}:00`
                  const isSelected = form.startTime === timeStr
                  return (
                    <div key={h} onClick={() => onFormChange({ ...form, startTime: timeStr })} className={`dash-pref-row ${isSelected ? 'selected' : ''}`}>
                      <span style={{ fontSize: 13, fontWeight: 600, width: 48 }}>{timeStr}</span>
                      <div className="dash-pref-track"><div className="dash-pref-bar" style={{ width: `${pct}%` }} /></div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 70, textAlign: 'right' }}>{stat.count}/{stat.total} άτομα</span>
                    </div>
                  )
                })}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>💡 Κλικ σε ώρα για επιλογή. Προτείνεται αυτή με τις περισσότερες προτιμήσεις.</p>
            </div>
            <FormField label="Εκπαιδευτής" type="select" value={form.instructorId} onChange={e => onFormChange({ ...form, instructorId: e.target.value })}>
              <option value="">-- Επίλεξε εκπαιδευτή --</option>
              {instructors.filter(i => i.specialty.includes(lesson.sport)).map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.specialty.map(s => s === 'ski' ? 'Σκι' : 'Snowboard').join(', ')})</option>
              ))}
            </FormField>
            <div style={{ background: 'var(--ice)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: 13 }}>Επιλεγμένη ώρα: <strong>{form.startTime || '—'}</strong></div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onSubmit}>🔒 Κλείδωμα Μαθήματος</button>
          </>
        )
      })()}
    </Modal>
  )
}

export default LockModal
