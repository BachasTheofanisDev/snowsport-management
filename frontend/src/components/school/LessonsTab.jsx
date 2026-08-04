import Card from '../ui/Card'
import FormField from '../ui/FormField'
import EmptyState from '../ui/EmptyState'
import {
  LEVEL_LABEL, SPORT_ICON, LEVEL_OPTIONS, SPORT_OPTIONS,
  DURATION_OPTIONS, PERSONS_OPTIONS, getValidStartTimes, calculatePrice
} from './constants'

/**
 * Tab Ατομικών Μαθημάτων: φόρμα + λίστα, με φίλτρο ημερομηνίας.
 */
function LessonsTab({
  lessons, instructors,
  showForm, onToggleForm, form, onFormChange, onSubmit, editing,
  loading, onEdit, onDelete, onCancelBooking
}) {
  return (
    <Card noBody title="Ατομικά μαθήματα"
      action={<button className="btn btn-primary btn-sm" onClick={onToggleForm}>{showForm ? 'Άκυρο' : '+ Νέο Μάθημα'}</button>}>
      {showForm && (
        <div className="dash-form-wrap">
          <form onSubmit={onSubmit}>
            <div className="form-grid">
              <FormField label="Ημερομηνία" type="date" value={form.date} onChange={e => onFormChange({ ...form, date: e.target.value })} min={new Date().toISOString().split('T')[0]} required />
              <FormField label="Ώρα Έναρξης" type="select" value={form.startTime} onChange={e => onFormChange({ ...form, startTime: e.target.value })}
                options={getValidStartTimes(form.duration).map(t => ({ value: t, label: t }))} />
              <FormField label="Διάρκεια (ώρες)" type="select" value={form.duration} onChange={e => onFormChange({ ...form, duration: e.target.value, startTime: '09:00' })} options={DURATION_OPTIONS} />
              <FormField label="Άθλημα" type="select" value={form.sport} onChange={e => onFormChange({ ...form, sport: e.target.value })} options={SPORT_OPTIONS} />
              <FormField label="Επίπεδο" type="select" value={form.level} onChange={e => onFormChange({ ...form, level: e.target.value })} options={LEVEL_OPTIONS} />
              <FormField label="Αριθμός Ατόμων" type="select" value={form.persons} onChange={e => onFormChange({ ...form, persons: parseInt(e.target.value) })} options={PERSONS_OPTIONS} />
              <FormField label="Εκπαιδευτής (προαιρετικό)" type="select" value={form.instructorId} onChange={e => onFormChange({ ...form, instructorId: e.target.value })}>
                <option value="">-- Χωρίς εκπαιδευτή (Pending) --</option>
                {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </FormField>
              <FormField label="Όνομα Πελάτη" value={form.customerName} onChange={e => onFormChange({ ...form, customerName: e.target.value })} required />
              <FormField label="Τηλέφωνο Πελάτη" value={form.customerPhone} onChange={e => onFormChange({ ...form, customerPhone: e.target.value })} required />
            </div>
            <div className="dash-price-box">
              <span className="dash-muted">Τύπος: {form.persons > 1 ? 'Ομαδικό (κλειστό)' : 'Ατομικό'} • Άτομα: {form.persons}</span>
              <div className="dash-price">Συνολικό κόστος: {calculatePrice(form.persons, form.duration)}€</div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Αποθήκευση...' : editing ? 'Αποθήκευση Αλλαγών' : 'Δημιουργία Μαθήματος'}</button>
          </form>
        </div>
      )}
      <div className="card-body">
        {lessons.length === 0
          ? <EmptyState>Δεν υπάρχουν μαθήματα για αυτή την ημερομηνία.</EmptyState>
          : lessons.map(lesson => (
            <div key={lesson.id} className="lesson-item">
              <div style={{ flex: 1 }}>
                <div className="lesson-sport">
                  {SPORT_ICON[lesson.sport]} {lesson.startTime} — {lesson.duration} ώρ. — {lesson.price}€
                  <span className={`badge ${lesson.type === 'group' ? 'badge-pending' : 'badge-confirmed'}`} style={{ marginLeft: 8 }}>
                    {lesson.type === 'group' ? `👥 Ομαδικό (${lesson.persons} άτομα)` : '👤 Ατομικό'}
                  </span>
                </div>
                <div className="lesson-meta">
                  📅 {new Date(lesson.date).toLocaleDateString('el-GR')} &nbsp;
                  👨‍🏫 {lesson.instructor?.name || 'Χωρίς εκπαιδευτή'} &nbsp;
                  📊 {LEVEL_LABEL[lesson.level]}
                </div>
                {lesson.bookings?.map(b => (
                  <div key={b.id} className="dash-booking" data-cancelled={b.status === 'cancelled'}>
                    <span>👤 {b.customerName} — 📞 {b.customerPhone}
                      {b.review && <span style={{ marginLeft: 8, color: '#f59e0b' }}>{'★'.repeat(b.review.rating)} {b.review.comment && `— "${b.review.comment}"`}</span>}
                    </span>
                    {b.status !== 'cancelled' && <button className="btn btn-danger btn-sm" onClick={() => onCancelBooking(b.id)}>Ακύρωση</button>}
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <span className={`badge badge-${lesson.status}`}>{lesson.status === 'confirmed' ? 'Επιβεβαιωμένο' : lesson.status === 'pending' ? 'Εκκρεμεί' : 'Ακυρωμένο'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => onEdit(lesson)}>Επεξεργασία</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(lesson.id)}>Διαγραφή</button>
              </div>
            </div>
          ))}
      </div>
    </Card>
  )
}

export default LessonsTab
