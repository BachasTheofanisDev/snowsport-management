import Card from '../ui/Card'
import FormField from '../ui/FormField'
import ProgressBar from '../ui/ProgressBar'
import EmptyState from '../ui/EmptyState'
import { LEVEL_LABEL, SPORT_ICON, LEVEL_OPTIONS, SPORT_OPTIONS, DURATION_OPTIONS } from './constants'

/**
 * Tab Ομαδικών Μαθημάτων: φόρμα δημιουργίας + κάρτες με μπάρες πληρότητας.
 */
function OpenGroupsTab({
  groupLessons,
  showForm, onToggleForm, form, onFormChange, onSubmit, loading, onLock
}) {
  return (
    <Card noBody title="Ομαδικά μαθήματα"
      action={<button className="btn btn-primary btn-sm" onClick={onToggleForm}>{showForm ? 'Άκυρο' : '+ Νέο Ομαδικό'}</button>}>
      {showForm && (
        <div className="dash-form-wrap">
          <form onSubmit={onSubmit}>
            <div className="form-grid">
              <FormField label="Ημερομηνία" type="date" value={form.date} onChange={e => onFormChange({ ...form, date: e.target.value })} min={new Date().toISOString().split('T')[0]} required />
              <FormField label="Διάρκεια (ώρες)" type="select" value={form.duration} onChange={e => onFormChange({ ...form, duration: parseInt(e.target.value) })} options={DURATION_OPTIONS} />
              <FormField label="Άθλημα" type="select" value={form.sport} onChange={e => onFormChange({ ...form, sport: e.target.value })} options={SPORT_OPTIONS} />
              <FormField label="Επίπεδο" type="select" value={form.level} onChange={e => onFormChange({ ...form, level: e.target.value })} options={LEVEL_OPTIONS} />
            </div>
            <div style={{ background: '#e0f2fe', border: '0.5px solid #7dd3fc', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: 13, color: '#075985' }}>
              ℹ️ Η ώρα και ο εκπαιδευτής θα οριστούν αργότερα, όταν μαζευτούν αρκετοί συμμετέχοντες (κλείδωμα).
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Δημιουργία...' : 'Δημιουργία Ομαδικού'}</button>
          </form>
        </div>
      )}
      <div className="card-body">
        {groupLessons.length === 0
          ? <EmptyState>Δεν υπάρχουν ομαδικά μαθήματα για αυτή την ημερομηνία.</EmptyState>
          : (
            <div className="dash-group-grid">
              {groupLessons.map(lesson => {
                const activeBookings = lesson.bookings?.filter(b => b.status !== 'cancelled') || []
                const filled = activeBookings.length
                const reachedMin = filled >= lesson.minPersons
                return (
                  <div key={lesson.id} className="dash-group-card">
                    <div className="dash-group-head">
                      <span className={`badge ${lesson.sport === 'ski' ? 'badge-confirmed' : 'badge-pending'}`}>{SPORT_ICON[lesson.sport]} {lesson.sport === 'ski' ? 'Σκι' : 'Snowboard'}</span>
                      <span className={`badge badge-${lesson.status}`}>{lesson.status === 'confirmed' ? 'Ενεργό' : lesson.status === 'pending' ? 'Αναμένει' : 'Ακυρ.'}</span>
                    </div>
                    <div className="dash-group-when">{new Date(lesson.date).toLocaleDateString('el-GR')} · {lesson.startTime || 'Ώρα μη ορισμένη'}</div>
                    <div className="dash-ins-sub">{lesson.duration} ώρ. · {LEVEL_LABEL[lesson.level]} · {lesson.instructor?.name || 'Χωρίς εκπαιδευτή'}</div>
                    <div className="dash-fill-label"><span className="dash-muted">Πληρότητα</span><span>{filled}/{lesson.maxPersons}</span></div>
                    <ProgressBar value={filled} max={lesson.maxPersons} success={reachedMin} height={8} />
                    <div className="dash-ins-sub" style={{ marginTop: 6 }}>Min {lesson.minPersons} · {20 * lesson.duration}€/άτομο</div>
                    {activeBookings.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {activeBookings.map(b => <span key={b.id} style={{ background: 'var(--ice)', borderRadius: 100, padding: '2px 8px', fontSize: 11 }}>👤 {b.customerName}</span>)}
                      </div>
                    )}
                    {lesson.status !== 'cancelled' && (
                      <button className="btn btn-primary btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }} onClick={() => onLock(lesson)}>
                        {lesson.startTime && lesson.instructor ? '🔧 Αλλαγή ώρας/εκπαιδευτή' : '🔒 Κλείδωμα'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
      </div>
    </Card>
  )
}

export default OpenGroupsTab
