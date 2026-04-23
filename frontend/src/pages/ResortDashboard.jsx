import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getSchools, createSchool, toggleSchool, deleteSchool } from '../api'

function ResortDashboard() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [schools, setSchools] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchSchools() }, [])

  const fetchSchools = async () => {
    try {
      const res = await getSchools()
      setSchools(res.data)
    } catch (err) { console.error(err) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createSchool(form)
      setForm({ name: '', email: '', password: '', phone: '' })
      setShowForm(false)
      fetchSchools()
    } catch (err) {
      setError(err.response?.data?.error || 'Κάτι πήγε στραβά')
    } finally { setLoading(false) }
  }

  const handleToggle = async (id) => {
    try {
      await toggleSchool(id)
      fetchSchools()
    } catch (err) {
      alert(err.response?.data?.error || 'Κάτι πήγε στραβά')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Σίγουρα θέλεις να διαγράψεις τη σχολή "${name}"; Θα διαγραφούν και όλα τα δεδομένα της!`)) return
    try {
      await deleteSchool(id)
      fetchSchools()
    } catch (err) {
      alert(err.response?.data?.error || 'Κάτι πήγε στραβά')
    }
  }

  const handleLogout = () => { logoutUser(); navigate('/') }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">🏔 SNOWSPORT <span>MANAGEMENT</span></div>
        <ul className="navbar-links">
          <li><button onClick={handleLogout}>Αποσύνδεση</button></li>
        </ul>
      </nav>

      <div className="page">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Χιονοδρομικό Κέντρο</div>
            <div className="stat-value" style={{ fontSize: 16, marginTop: 4 }}>{user?.name}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Σύνολο Σχολών</div>
            <div className="stat-value blue">{schools.length}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Σχολές Σκι</span>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Άκυρο' : '+ Νέα Σχολή'}
            </button>
          </div>

          {showForm && (
            <div style={{ padding: '1.25rem', borderBottom: '0.5px solid var(--border)', background: 'var(--ice)' }}>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  {[
                    { key: 'name', label: 'Όνομα', type: 'text' },
                    { key: 'email', label: 'Email', type: 'email' },
                    { key: 'password', label: 'Κωδικός', type: 'password' },
                    { key: 'phone', label: 'Τηλέφωνο', type: 'text' },
                  ].map(f => (
                    <div className="form-group" key={f.key}>
                      <label className="form-label">{f.label}</label>
                      <input
                        className="form-input"
                        type={f.type}
                        value={form[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        required={f.key !== 'phone'}
                      />
                    </div>
                  ))}
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Δημιουργία...' : 'Δημιουργία Σχολής'}
                </button>
              </form>
            </div>
          )}

          <div className="card-body">
            {schools.map(school => (
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
                  <span className={`badge ${school.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>
                    {school.isActive ? 'Ενεργή' : 'Ανενεργή'}
                  </span>
                  <button className="btn btn-warning btn-sm" onClick={() => handleToggle(school.id)}>
                    {school.isActive ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(school.id, school.name)}>
                    Διαγραφή
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default ResortDashboard