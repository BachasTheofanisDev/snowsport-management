import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getMyBookings, cancelCustomerBooking, createReview } from '../api'
import NewBookingForm from '../components/NewBookingForm'

function CustomerDashboard() {
    const { user, logoutUser } = useAuth()
    const navigate = useNavigate()
    const [bookings, setBookings] = useState([])
    const [activeTab, setActiveTab] = useState('bookings')
    const [reviewModal, setReviewModal] = useState(null) // booking που αξιολογείται
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')

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

    const handleReview = async () => {
        try {
            await createReview({ bookingId: reviewModal.id, rating, comment })
            setReviewModal(null)
            setRating(5)
            setComment('')
            fetchBookings()
            alert('Η αξιολόγησή σου καταχωρήθηκε! ⭐')
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
                                                {b.review && (
                                                    <span style={{ marginLeft: 8, fontSize: 12, color: '#f59e0b' }}>
                                                        {'★'.repeat(b.review.rating)} Αξιολογήθηκε
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {b.status !== 'cancelled' && (
                                                <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.id)}>
                                                    Ακύρωση
                                                </button>
                                            )}
                                            {b.status === 'confirmed' && new Date(b.lesson?.date) < new Date() && !b.review && (
                                                <button className="btn btn-success btn-sm" onClick={() => setReviewModal(b)}>
                                                    ⭐ Αξιολόγηση
                                                </button>
                                            )}
                                        </div>
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

            {reviewModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '100%', maxWidth: 480, margin: '1rem' }}>
                        <div className="card-header" style={{ background: 'var(--navy)', color: 'white' }}>
                            <span className="card-title" style={{ color: 'white' }}>⭐ Αξιολόγηση Μαθήματος</span>
                            <button onClick={() => setReviewModal(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18 }}>✕</button>
                        </div>
                        <div className="card-body">
                            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: 13 }}>
                                {reviewModal.lesson?.sport === 'ski' ? '⛷️' : '🏂'} {reviewModal.lesson?.startTime} — {new Date(reviewModal.lesson?.date).toLocaleDateString('el-GR')}
                            </p>

                            <div className="form-group">
                                <label className="form-label">Βαθμολογία</label>
                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: 32, marginTop: 8 }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span key={star} onClick={() => setRating(star)}
                                            style={{ cursor: 'pointer', color: star <= rating ? '#f59e0b' : '#e2e8f0' }}>
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Σχόλιο (προαιρετικό)</label>
                                <textarea className="form-input" rows={3}
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Πώς ήταν το μάθημα;" />
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                                onClick={handleReview}>
                                Υποβολή Αξιολόγησης
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default CustomerDashboard