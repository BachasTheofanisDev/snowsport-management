import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'

/**
 * Accordion δέντρο: Χιονοδρομικά → Σχολές → Εκπαιδευτές.
 */
function ResortTree({
  resorts, expandedResorts, expandedSchools,
  onToggleResort, onToggleSchool, onNew, onDelete
}) {
  return (
    <Card title="Χιονοδρομικά Κέντρα"
      action={<button className="btn btn-primary btn-sm" onClick={onNew}>+ Νέο Χιονοδρομικό</button>}>
      {resorts.length === 0
        ? <EmptyState>Δεν υπάρχουν χιονοδρομικά.</EmptyState>
        : resorts.map(resort => {
          const isResortOpen = expandedResorts.includes(resort.id)
          const totalInstructors = resort.schools.reduce((sum, s) => sum + s.instructors.length, 0)
          return (
            <div key={resort.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }} onClick={() => onToggleResort(resort.id)}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', transform: isResortOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>🏔 {resort.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{resort.email} {resort.phone && `• ${resort.phone}`}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>🎿 {resort.schools.length} σχολές • 👨‍🏫 {totalInstructors} εκπαιδευτές</div>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(resort.id, resort.name)}>Διαγραφή</button>
              </div>

              {isResortOpen && (
                <div style={{ paddingLeft: 24, paddingBottom: 12 }}>
                  {resort.schools.length === 0
                    ? <p style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '8px 0' }}>Δεν υπάρχουν σχολές.</p>
                    : resort.schools.map(school => {
                      const isSchoolOpen = expandedSchools.includes(school.id)
                      return (
                        <div key={school.id} style={{ borderLeft: '2px solid var(--border)', paddingLeft: 12, marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 0' }} onClick={() => onToggleSchool(school.id)}>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', transform: isSchoolOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>
                                🎿 {school.name} {!school.isActive && <span style={{ color: 'var(--text-secondary)' }}>(ανενεργή)</span>}
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}> — {school.instructors.length} εκπαιδευτές</span>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{school.email} {school.phone && `• ${school.phone}`}</div>
                            </div>
                          </div>
                          {isSchoolOpen && (
                            <div style={{ paddingLeft: 20, paddingBottom: 8 }}>
                              {school.instructors.length === 0
                                ? <p style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0' }}>Δεν υπάρχουν εκπαιδευτές.</p>
                                : school.instructors.map(inst => (
                                  <div key={inst.id} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0' }}>
                                    👨‍🏫 {inst.name}<span style={{ marginLeft: 6 }}>— {inst.email}{inst.phone && ` • ${inst.phone}`}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
    </Card>
  )
}

export default ResortTree
