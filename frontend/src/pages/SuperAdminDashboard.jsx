import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getOverview, getAllResorts, getAllCustomers, createResortAdmin, deleteResortAdmin } from '../api'
import DashboardShell from '../components/ui/DashboardShell'
import KpiCard from '../components/ui/KpiCard'
import ResortTree from '../components/admin/ResortTree'
import CustomersTab from '../components/admin/CustomersTab'
import NewResortModal from '../components/admin/NewResortModal'
import '../components/ui/dashboard-layout.css'

function SuperAdminDashboard() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [resorts, setResorts] = useState([])
  const [customers, setCustomers] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [expandedResorts, setExpandedResorts] = useState([])
  const [expandedSchools, setExpandedSchools] = useState([])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [o, r, c] = await Promise.all([getOverview(), getAllResorts(), getAllCustomers()])
      setOverview(o.data); setResorts(r.data); setCustomers(c.data)
    } catch (err) { console.error(err) }
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setError('')
    try {
      await createResortAdmin(form)
      setForm({ name: '', email: '', password: '', phone: '' })
      setShowForm(false); fetchAll()
    } catch (err) { setError(err.response?.data?.error || 'Κάτι πήγε στραβά') }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Σίγουρα θέλεις να διαγράψεις το "${name}"; Θα διαγραφούν ΟΛΑ τα δεδομένα του!`)) return
    try { await deleteResortAdmin(id); fetchAll() } catch (err) { alert(err.response?.data?.error || 'Κάτι πήγε στραβά') }
  }

  const handleLogout = () => { logoutUser(); navigate('/') }

  const toggleResort = (id) => setExpandedResorts(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  const toggleSchool = (id) => setExpandedSchools(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const NAV = [
    { id: 'overview', label: 'Επισκόπηση', dot: '#7eb8f7' },
    { id: 'resorts', label: 'Χιονοδρομικά', dot: '#17a2ad', badge: resorts.length },
    { id: 'customers', label: 'Πελάτες', dot: '#94a3b8', badge: customers.length },
  ]
  const TITLES = { overview: 'Επισκόπηση συστήματος', resorts: 'Χιονοδρομικά κέντρα', customers: 'Πελάτες' }

  const sidebarProps = {
    brand: 'Διαχείριση', brandSub: 'SNOWSPORT · ADMIN', logo: '👑',
    navItems: NAV, activeTab, onTabChange: (id) => { setActiveTab(id); setError('') }, user, onLogout: handleLogout
  }

  const headerAction = (activeTab === 'overview' || activeTab === 'resorts')
    ? <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Νέο χιονοδρομικό</button>
    : null

  return (
    <DashboardShell sidebarProps={sidebarProps} title={TITLES[activeTab]} headerAction={headerAction}>
      {activeTab === 'overview' && (
        <div className="dash-stack">
          {overview && (
            <div className="dash-kpis">
              <KpiCard label="Χιονοδρομικά" value={overview.resorts} sub="στο σύστημα" color="#185FA5" />
              <KpiCard label="Σχολές" value={overview.schools} sub="συνολικά" />
              <KpiCard label="Εκπαιδευτές" value={overview.instructors} sub="ενεργοί" />
              <KpiCard label="Πελάτες" value={overview.customers} sub="εγγεγραμμένοι" color="var(--confirmed-text)" />
            </div>
          )}
          <ResortTree resorts={resorts} expandedResorts={expandedResorts} expandedSchools={expandedSchools}
            onToggleResort={toggleResort} onToggleSchool={toggleSchool} onNew={() => setShowForm(true)} onDelete={handleDelete} />
        </div>
      )}

      {activeTab === 'resorts' && (
        <ResortTree resorts={resorts} expandedResorts={expandedResorts} expandedSchools={expandedSchools}
          onToggleResort={toggleResort} onToggleSchool={toggleSchool} onNew={() => setShowForm(true)} onDelete={handleDelete} />
      )}

      {activeTab === 'customers' && <CustomersTab customers={customers} />}

      <NewResortModal open={showForm} onClose={() => { setShowForm(false); setError('') }}
        form={form} onChange={setForm} onSubmit={handleCreate} error={error} />
    </DashboardShell>
  )
}

export default SuperAdminDashboard
