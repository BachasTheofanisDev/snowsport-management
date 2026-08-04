import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import FormField from '../ui/FormField'
import EmptyState from '../ui/EmptyState'

/**
 * Tab Εκπαιδευτών: φόρμα δημιουργίας + grid καρτών.
 */
function InstructorsTab({
  instructors, showForm, onToggleForm,
  form, onFormChange, onToggleSpecialty, onSubmit, loading
}) {
  return (
    <Card noBody title="Εκπαιδευτές"
      action={<button className="btn btn-primary btn-sm" onClick={onToggleForm}>{showForm ? 'Άκυρο' : '+ Νέος Εκπαιδευτής'}</button>}>
      {showForm && (
        <div className="dash-form-wrap">
          <form onSubmit={onSubmit}>
            <div className="form-grid">
              <FormField label="Όνομα" value={form.name} onChange={e => onFormChange({ ...form, name: e.target.value })} required />
              <FormField label="Email" type="email" value={form.email} onChange={e => onFormChange({ ...form, email: e.target.value })} required />
              <FormField label="Κωδικός" type="password" value={form.password} onChange={e => onFormChange({ ...form, password: e.target.value })} required />
              <FormField label="Τηλέφωνο" value={form.phone} onChange={e => onFormChange({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Ειδικότητα</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {['ski', 'snowboard'].map(sport => (
                  <label key={sport} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.specialty.includes(sport)} onChange={() => onToggleSpecialty(sport)} />
                    {sport === 'ski' ? '⛷️ Σκι' : '🏂 Snowboard'}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Δημιουργία...' : 'Δημιουργία Εκπαιδευτή'}</button>
          </form>
        </div>
      )}
      <div className="card-body">
        {instructors.length === 0
          ? <EmptyState>Δεν υπάρχουν εκπαιδευτές ακόμα.</EmptyState>
          : (
            <div className="dash-ins-grid">
              {instructors.map(ins => (
                <div key={ins.id} className="dash-ins-card">
                  <div className="dash-ins-card-head">
                    <Avatar name={ins.name} />
                    <div>
                      <div className="dash-ins-name">{ins.name}</div>
                      <div className="dash-ins-sub">
                        {ins.specialty.map(s => s === 'ski' ? '⛷️ Σκι' : '🏂 Snowboard').join(' · ')}
                        {ins.totalReviews > 0
                          ? <span style={{ color: '#f59e0b' }}> · ★ {ins.avgRating} ({ins.totalReviews})</span>
                          : <span> · Χωρίς αξιολογήσεις</span>}
                      </div>
                    </div>
                  </div>
                  <div className="dash-ins-contact">
                    <div>{ins.email}</div>
                    {ins.phone && <div>📞 {ins.phone}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </Card>
  )
}

export default InstructorsTab
