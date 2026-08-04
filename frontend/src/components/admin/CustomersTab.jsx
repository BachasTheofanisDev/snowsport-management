import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import EmptyState from '../ui/EmptyState'

/**
 * Tab Πελατών: λίστα όλων των πελατών.
 */
function CustomersTab({ customers }) {
  return (
    <Card title="Πελάτες">
      {customers.length === 0
        ? <EmptyState>Δεν υπάρχουν πελάτες.</EmptyState>
        : customers.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 0', borderBottom: '0.5px solid var(--border)' }}>
            <Avatar name={c.name} size="sm" />
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{c.email} {c.phone && `• ${c.phone}`}</div>
            </div>
          </div>
        ))}
    </Card>
  )
}

export default CustomersTab
