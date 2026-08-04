import Card from '../ui/Card'
import FormField from '../ui/FormField'

/**
 * Tab Πληροφοριών Χιονοδρομικού: υψόμετρα, αναβατήρες, πίστες ανά επίπεδο, επικοινωνία.
 */
function ResortInfoTab({ info, onChange, onSubmit, loading }) {
  const set = (key) => (e) => onChange({ ...info, [key]: e.target.value })

  return (
    <Card title="ℹ️ Πληροφορίες Χιονοδρομικού">
      <form onSubmit={onSubmit}>
        <FormField label="Περιγραφή" type="textarea" rows={3} value={info.description}
          onChange={set('description')} placeholder="Σύντομη περιγραφή του χιονοδρομικού..." />

        <div className="form-grid">
          <FormField label="Υψόμετρο Βάσης (μ)" type="number" value={info.baseAltitude} onChange={set('baseAltitude')} placeholder="1700" />
          <FormField label="Υψόμετρο Κορυφής (μ)" type="number" value={info.peakAltitude} onChange={set('peakAltitude')} placeholder="2340" />
          <FormField label="Αριθμός Αναβατήρων" type="number" value={info.liftsCount} onChange={set('liftsCount')} placeholder="7" />
          <FormField label="Συνολικό Μήκος Πιστών (χλμ)" type="number" value={info.totalSlopeLength} onChange={set('totalSlopeLength')} placeholder="20" />
        </div>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label">Πίστες ανά Επίπεδο</label>
          <div className="form-grid">
            <FormField label="🟢 Πράσινες" type="number" value={info.slopesGreen} onChange={set('slopesGreen')} placeholder="0" />
            <FormField label="🔵 Μπλε" type="number" value={info.slopesBlue} onChange={set('slopesBlue')} placeholder="0" />
            <FormField label="🔴 Κόκκινες" type="number" value={info.slopesRed} onChange={set('slopesRed')} placeholder="0" />
            <FormField label="⚫ Μαύρες" type="number" value={info.slopesBlack} onChange={set('slopesBlack')} placeholder="0" />
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <FormField label="Τηλέφωνο" value={info.phone} onChange={set('phone')} placeholder="2692022000" />
          <FormField label="Τοποθεσία" value={info.location} onChange={set('location')} placeholder="Καλάβρυτα, Αχαΐα" />
          <FormField label="Ωράριο Λειτουργίας" value={info.openingHours} onChange={set('openingHours')} placeholder="09:00 - 16:00" />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Αποθήκευση...' : 'Αποθήκευση Πληροφοριών'}
        </button>
      </form>
    </Card>
  )
}

export default ResortInfoTab
