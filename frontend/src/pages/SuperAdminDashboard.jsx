import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getOverview, getAllResorts, getAllCustomers, createResortAdmin, deleteResortAdmin } from '../api'

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

    useEffect(() => {
        fetchAll()
    }, [])

    const fetchAll = async () => {
        try {
            const [o, r, c] = await Promise.all([getOverview(), getAllResorts(), getAllCustomers()])
            setOverview(o.data)
            setResorts(r.data)
            setCustomers(c.data)
        } catch (err) { console.error(err) }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await createResortAdmin(form)
            setForm({ name: '', email: '', password: '', phone: '' })
            setShowForm(false)
            fetchAll()
        } catch (err) {
            setError(err.response?.data?.error || 'Κάτι πήγε στραβά')
        }
    }

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Σίγουρα θέλεις να διαγράψεις το "${name}"; Θα διαγραφούν ΟΛΑ τα δεδομένα του!`)) return
        try {
            await deleteResortAdmin(id)
            fetchAll()
        } catch (err) {
            alert(err.response?.data?.error || 'Κάτι πήγε στραβά')
        }
    }

    const handleLogout = () => { logoutUser(); navigate('/') }

    return (
        <>
            <nav className="navbar">
                <div className="navbar-brand">👑 SNOWSPORT <span>ADMIN</span></div>
                <ul className="navbar-links">
                    <li><button onClick={handleLogout}>Αποσύνδεση</button></li>
                </ul>
            </nav>

            <div className="page">
                {/* Overview Stats */}
                {overview && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Χιονοδρομικά</div>
                            <div className="stat-value blue">{overview.resorts}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Σχολές</div>
                            <div className="stat-value">{overview.schools}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Εκπαιδευτές</div>
                            <div className="stat-value">{overview.instructors}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Πελάτες</div>
                            <div className="stat-value green">{overview.customers}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Μαθήματα</div>
                            <div className="stat-value amber">{overview.lessons}</div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="tabs">
                    {['resorts', 'customers'].map(tab => (
                        <button key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}>
                            {tab === 'resorts' ? `🏔 Χιονοδρομικά (${resorts.length})` : `👤 Πελάτες (${customers.length})`}
                        </button>
                    ))}
                </div>

                {/* Resorts Tab */}
                {activeTab === 'resorts' && (
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Χιονοδρομικά Κέντρα</span>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                                {showForm ? 'Άκυρο' : '+ Νέο Χιονοδρομικό'}
                            </button>
                        </div>

                        {showForm && (
                            <div style={{ padding: '1.25rem', borderBottom: '0.5px solid var(--border)', background: 'var(--ice)' }}>
                                {error && <div className="alert alert-error">{error}</div>}
                                <form onSubmit={handleCreate}>
                                    <div className="form-grid">
                                        {[
                                            { key: 'name', label: 'Όνομα', type: 'text' },
                                            { key: 'email', label: 'Email', type: 'email' },
                                            { key: 'password', label: 'Κωδικός', type: 'password' },
                                            { key: 'phone', label: 'Τηλέφωνο', type: 'text' },
                                        ].map(f => (
                                            <div className="form-group" key={f.key}>
                                                <label className="form-label">{f.label}</label>
                                                <input className="form-input" type={f.type}
                                                    value={form[f.key]}
                                                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                                    required={f.key !== 'phone'} />
                                            </div>
                                        ))}
                                    </div>
                                    <button type="submit" className="btn btn-primary">Δημιουργία</button>
                                </form>
                            </div>
                        )}

                        <div className="card-body">
                            {resorts.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν χιονοδρομικά.</p>
                            ) : (
                                resorts.map(resort => (
                                    <div key={resort.id} style={{ padding: '1rem 0', borderBottom: '0.5px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 15 }}>🏔 {resort.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                    {resort.email} {resort.phone && `• ${resort.phone}`}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                                                    🎿 {resort.schools.length} σχολές • 👨‍🏫 {resort.schools.reduce((sum, s) => sum + s.instructors.length, 0)} εκπαιδευτές • 📅 {resort.schools.reduce((sum, s) => sum + s.lessons.length, 0)} μαθήματα
                                                </div>
                                                {resort.schools.length > 0 && (
                                                    <div style={{ marginTop: 8, paddingLeft: 16 }}>
                                                        {resort.schools.map(s => (
                                                            <div key={s.id} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '2px 0' }}>
                                                                • {s.name} {!s.isActive && '(ανενεργή)'} — {s.instructors.length} εκπ. / {s.lessons.length} μαθ.
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(resort.id, resort.name)}>
                                                Διαγραφή
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Customers Tab */}
                {activeTab === 'customers' && (
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Πελάτες</span>
                        </div>
                        <div className="card-body">
                            {customers.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν πελάτες.</p>
                            ) : (
                                customers.map(c => (
                                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '0.5px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontWeight: 500, fontSize: 14 }}>👤 {c.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                {c.email} {c.phone && `• ${c.phone}`}
                                            </div>
                                        </div>
                                        <span className="badge badge-confirmed">{c.bookings.length} κρατήσεις</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default SuperAdminDashboard