import Modal from '../ui/Modal'
import FormField from '../ui/FormField'

/**
 * Modal δημιουργίας νέου χιονοδρομικού (resort admin).
 */
function NewResortModal({ open, onClose, form, onChange, onSubmit, error }) {
  return (
    <Modal open={open} onClose={onClose} title="👑 Νέο Χιονοδρομικό" maxWidth={520}>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <FormField label="Όνομα" value={form.name} onChange={e => onChange({ ...form, name: e.target.value })} required />
          <FormField label="Email" type="email" value={form.email} onChange={e => onChange({ ...form, email: e.target.value })} required />
          <FormField label="Κωδικός" type="password" value={form.password} onChange={e => onChange({ ...form, password: e.target.value })} required />
          <FormField label="Τηλέφωνο" value={form.phone} onChange={e => onChange({ ...form, phone: e.target.value })} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Δημιουργία</button>
      </form>
    </Modal>
  )
}

export default NewResortModal
