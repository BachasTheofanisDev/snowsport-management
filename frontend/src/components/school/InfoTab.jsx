import Card from '../ui/Card'
import FormField from '../ui/FormField'

/**
 * Tab Πληροφοριών σχολής: περιγραφή.
 */
function InfoTab({ info, onChange, onSubmit, loading }) {
  return (
    <Card title="Πληροφορίες σχολής">
      <form onSubmit={onSubmit}>
        <FormField label="Περιγραφή" type="textarea" rows={5} value={info.description}
          onChange={e => onChange({ ...info, description: e.target.value })}
          placeholder="Περιγραφή της σχολής, ιστορικό, φιλοσοφία, εμπειρία..." />
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Αποθήκευση...' : 'Αποθήκευση Πληροφοριών'}</button>
      </form>
    </Card>
  )
}

export default InfoTab
