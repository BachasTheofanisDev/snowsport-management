import Modal from '../ui/Modal'
import FormField from '../ui/FormField'

/**
 * Modal δημιουργίας νέας σχολής.
 */
function NewSchoolModal({ open, onClose, form, onChange, onSubmit, error, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="Νέα Σχολή" maxWidth={520}>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <FormField label="Όνομα" value={form.name} onChange={e => onChange({ ...form, name: e.target.value })} required />
          <FormField label="Email" type="email" value={form.email} onChange={e => onChange({ ...form, email: e.target.value })} required />
          <FormField label="Κωδικός" type="password" value={form.password} onChange={e => onChange({ ...form, password: e.target.value })} required />
          <FormField label="Τηλέφωνο" value={form.phone} onChange={e => onChange({ ...form, phone: e.target.value })} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? 'Δημιουργία...' : 'Δημιουργία Σχολής'}
        </button>
      </form>
    </Modal>
  )
}

export default NewSchoolModal
