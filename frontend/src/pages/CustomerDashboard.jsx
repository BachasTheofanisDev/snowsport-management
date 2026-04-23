import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getMyBookings, cancelCustomerBooking } from '../api'
import NewBookingForm from '../components/NewBookingForm'

function CustomerDashboard() {
    const { user, logoutUser } = useAuth()
    const navigate = useNavigate()
    const [bookings, setBookings] = useState([])
    const [activeTab, setActiveTab] = useState('bookings')

    useEffect(() => { fetchBookings() }, [])

    const fetchBookings = async () => {
        try {
            const res = await getMyBookings()
            setBookings(res.data)
        } catch (err) { console.error(err) }
    }

    const handleCancel = async (id) => {
        if (!window.confirm('Σίγουρα θέλεις να ακυρώσεις αυτή την κράτηση;')) return
        try {
            await cancelCustomerBooking(id)
            fetchBookings()
        } catch (err) {
            alert(err.response?.data?.error || 'Κάτι πήγε στραβά')
        }
    }

    const handleLogout = () => { logoutUser(); navigate('/') }

    const confirmed = bookings.filter(b => b.status === 'confirmed')
    const pending = bookings.filter(b => b.status === 'pending')

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
                        <div className="stat-label">Καλώς ήρθες</div>
                        <div className="stat-value" style={{ fontSize: 16, marginTop: 4 }}>{user?.name}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Σύνολο Κρατήσεων</div>
                        <div className="stat-value">{bookings.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Επιβεβαιωμένες</div>
                        <div className="stat-value green">{confirmed.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Εκκρεμείς</div>
                        <div className="stat-value amber">{pending.length}</div>
                    </div>
                </div>

                <div className="tabs">
                    {['bookings', 'new'].map(tab => (
                        <button key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}>
                            {tab === 'bookings' ? `📋 Οι Κρατήσεις μου (${bookings.length})` : '➕ Νέα Κράτηση'}
                        </button>
                    ))}
                </div>

                {activeTab === 'bookings' && (
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Οι Κρατήσεις μου</span>
                        </div>
                        <div className="card-body">
                            {bookings.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν έχεις κρατήσεις ακόμα.</p>
                            ) : (
                                bookings.map(b => (
                                    <div key={b.id} className="lesson-item">
                                        <div style={{ flex: 1 }}>
                                            <div className="lesson-sport">
                                                {b.lesson?.sport === 'ski' ? '⛷️' : '🏂'} {b.lesson?.startTime} — {b.lesson?.duration} ώρ. — {b.lesson?.price}€
                                                <span className={`badge ${b.lesson?.type === 'group' ? 'badge-pending' : 'badge-confirmed'}`} style={{ marginLeft: 8 }}>
                                                    {b.lesson?.type === 'group' ? `👥 Ομαδικό (${b.lesson?.persons} άτομα)` : '👤 Ατομικό'}
                                                </span>
                                            </div>
                                            <div className="lesson-meta">
                                                📅 {new Date(b.lesson?.date).toLocaleDateString('el-GR')} &nbsp;
                                                🏫 {b.lesson?.school?.name} &nbsp;
                                                👨‍🏫 {b.lesson?.instructor?.name || 'Αναμένεται ανάθεση'}
                                            </div>
                                            <div style={{ marginTop: 8 }}>
                                                <span className={`badge badge-${b.status}`}>
                                                    {b.status === 'confirmed' ? 'Επιβεβαιωμένο' : b.status === 'pending' ? 'Εκκρεμεί' : 'Ακυρωμένο'}
                                                </span>
                                            </div>
                                        </div>
                                        {b.status !== 'cancelled' && (
                                            <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.id)}>
                                                Ακύρωση
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'new' && (
                    <NewBookingForm onBookingComplete={() => {
                        fetchBookings()
                        setActiveTab('bookings')
                    }} />
                )}
            </div>
        </>
    )
}

export default CustomerDashboard