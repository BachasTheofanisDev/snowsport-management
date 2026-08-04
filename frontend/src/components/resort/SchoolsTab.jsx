import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'

/**
 * Tab Σχολών: λίστα σχολών με ενεργοποίηση/απενεργοποίηση/διαγραφή.
 */
function SchoolsTab({ schools, onNew, onToggle, onDelete }) {
  return (
    <Card title="Σχολές Σκι"
      action={<button className="btn btn-primary btn-sm" onClick={onNew}>+ Νέα Σχολή</button>}>
      {schools.length === 0
        ? <EmptyState>Δεν υπάρχουν σχολές ακόμα. Πρόσθεσε την πρώτη!</EmptyState>
        : schools.map(school => (
          <div key={school.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '0.5px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14, color: school.isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {school.name} {!school.isActive && '(Ανενεργή)'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {school.email} {school.phone && `• ${school.phone}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge status={school.isActive ? 'confirmed' : 'cancelled'}>{school.isActive ? 'Ενεργή' : 'Ανενεργή'}</Badge>
              <button className="btn btn-warning btn-sm" onClick={() => onToggle(school.id)}>
                {school.isActive ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(school.id, school.name)}>Διαγραφή</button>
            </div>
          </div>
        ))}
    </Card>
  )
}

export default SchoolsTab
