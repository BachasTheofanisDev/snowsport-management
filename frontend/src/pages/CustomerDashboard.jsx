import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getMyBookings, cancelCustomerBooking, createReview } from '../api'
import NewBookingForm from '../components/NewBookingForm'
import BookingFlow from '../components/BookingFlow'

function CustomerDashboard() {
    const { user, logoutUser } = useAuth()
    const navigate = useNavigate()
    const [bookings, setBookings] = useState([])
    const [activeTab, setActiveTab] = useState('bookings')
    const [reviewModal, setReviewModal] = useState(null)
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [bookingPreset, setBookingPreset] = useState(null)

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
        } catch (err) {
            alert(err.response?.data?.error || 'Κάτι πήγε στραβά')
        }
    }

    const handleLogout = () => { logoutUser(); navigate('/') }

    const todayStr = new Date().toISOString().split('T')[0]
    const dateStr = (d) => new Date(d).toISOString().split('T')[0]

    // Μελλοντικές (από σήμερα και μετά) vs Ιστορικό (πριν σήμερα)
    const activeBookings = bookings.filter(b => b.status !== 'cancelled')
    const upcomingBookings = activeBookings.filter(b => dateStr(b.lesson?.date) >= todayStr)
    const pastBookings = activeBookings.filter(b => dateStr(b.lesson?.date) < todayStr)

    // Stats βάσει μελλοντικών
    const confirmed = upcomingBookings.filter(b => b.status === 'confirmed')
    const pending = upcomingBookings.filter(b => b.status === 'pending')

    // Εκκρεμείς αξιολογήσεις (ολοκληρωμένα μαθήματα χωρίς αξιολόγηση)
    const pendingReviews = pastBookings.filter(b => b.status === 'confirmed' && !b.review)

    const heroBackground = 'linear-gradient(135deg, #0c2740 0%, #0284c7 100%)'

    const renderBookingItem = (b, isPast = false) => (
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
                    {!isPast && (
                        (() => {
                            const isOpen = b.lesson?.type === 'open_group'
                            if (!isOpen) {
                                const labels = {
                                    confirmed: 'Επιβεβαιωμένο',
                                    pending: 'Εκκρεμεί',
                                    cancelled: 'Ακυρωμένο'
                                }
                                return <span className={`badge badge-${b.status}`}>{labels[b.status]}</span>
                            }

                            // Ανοιχτό μάθημα — αναλυτικό status
                            const filled = b.lesson?.participantCount || 0
                            const minP = b.lesson?.minPersons || 4
                            const needsPeople = filled < minP
                            const needsInstructor = !b.lesson?.instructor
                            const status = b.lesson?.status

                            if (status === 'confirmed') {
                                return <span className="badge badge-confirmed">Επιβεβαιωμένο ✅</span>
                            }

                            const reasons = []
                            if (needsPeople) reasons.push(`αναμένει ${minP - filled} ${minP - filled === 1 ? 'άτομο' : 'άτομα'} ακόμα`)
                            if (needsInstructor) reasons.push('αναμένει εκπαιδευτή')

                            return (
                                <span className="badge badge-pending">
                                    ⏳ {reasons.join(' • ')}
                                </span>
                            )
                        })()
                    )}
                    {b.review && (
                        <span style={{ fontSize: 12, color: '#f59e0b' }}>
                            {'★'.repeat(b.review.rating)}{'☆'.repeat(5 - b.review.rating)}
                            {b.review.comment && <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>"{b.review.comment}"</span>}
                        </span>
                    )}
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {!isPast && b.status !== 'cancelled' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.id)}>
                        Ακύρωση
                    </button>
                )}
                {isPast && b.status === 'confirmed' && !b.review && (
                    <button className="btn btn-success btn-sm" onClick={() => { setReviewModal(b); setRating(5); setComment('') }}>
                        ⭐ Αξιολόγηση
                    </button>
                )}
            </div>
        </div>
    )

    return (
        <>
            <div className="hero-banner" style={{
                position: 'relative',
                height: 300,
                overflow: 'hidden',
                background: heroBackground
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', position: 'relative', zIndex: 2 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#fff' }}>
                        🏔 SNOWSPORT <span style={{ fontWeight: 300 }}>MANAGEMENT</span>
                    </div>
                    <button onClick={handleLogout} style={{ padding: '10px 22px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                        Αποσύνδεση
                    </button>
                </div>

                <div style={{ position: 'absolute', bottom: 40, left: 48, zIndex: 2, color: '#fff' }}>
                    <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-1px', marginBottom: 6, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                        Καλώς ήρθες, {user?.name}! 👋
                    </h1>
                    <p style={{ fontSize: 16, opacity: 0.95, textShadow: '0 1px 10px rgba(0,0,0,0.4)' }}>
                        Έτοιμος για την επόμενη κατάβαση;
                    </p>
                </div>
            </div>

            <div className="page">
                <div className="stats-grid" style={{ marginTop: -70, position: 'relative', zIndex: 3 }}>
                    <div className="stat-card">
                        <div className="stat-label">Επερχόμενες</div>
                        <div className="stat-value blue">{upcomingBookings.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Επιβεβαιωμένες</div>
                        <div className="stat-value green">{confirmed.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Εκκρεμείς</div>
                        <div className="stat-value amber">{pending.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Ολοκληρωμένα</div>
                        <div className="stat-value">{pastBookings.length}</div>
                    </div>
                </div>

                {/* Banner εκκρεμών αξιολογήσεων */}
                {pendingReviews.length > 0 && (
                    <div style={{
                        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                        border: '1px solid #f59e0b',
                        borderRadius: 14,
                        padding: '1rem 1.25rem',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12
                    }}>
                        <div style={{ fontSize: 14, color: '#92400e', fontWeight: 600 }}>
                            ⭐ Έχεις {pendingReviews.length} {pendingReviews.length === 1 ? 'μάθημα που περιμένει' : 'μαθήματα που περιμένουν'} αξιολόγηση!
                        </div>
                        <button className="btn btn-sm" style={{ background: '#f59e0b', color: '#fff' }}
                            onClick={() => setActiveTab('history')}>
                            Αξιολόγησε τώρα
                        </button>
                    </div>
                )}

                <div className="tabs">
                    {['bookings', 'history', 'new'].map(tab => (
                        <button key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => { setActiveTab(tab); if (tab === 'new') setBookingPreset(null) }}>
                            {tab === 'bookings' ? `📋 Οι Κρατήσεις μου (${upcomingBookings.length})`
                                : tab === 'history' ? (
                                    <>🕐 Ιστορικό{pendingReviews.length > 0 && (
                                        <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff', borderRadius: 100, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                                            {pendingReviews.length}
                                        </span>
                                    )}</>
                                ) : '➕ Νέα Κράτηση'}
                        </button>
                    ))}
                </div>

                {/* Επερχόμενες κρατήσεις */}
                {activeTab === 'bookings' && (
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Οι Κρατήσεις μου</span>
                        </div>
                        <div className="card-body">
                            {upcomingBookings.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν έχεις επερχόμενες κρατήσεις. Κάνε μια νέα κράτηση!</p>
                            ) : (
                                upcomingBookings
                                    .sort((a, b) => new Date(a.lesson?.date) - new Date(b.lesson?.date))
                                    .map(b => renderBookingItem(b, false))
                            )}
                        </div>
                    </div>
                )}

                {/* Ιστορικό */}
                {activeTab === 'history' && (
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">🕐 Ιστορικό Κρατήσεων</span>
                        </div>
                        <div className="card-body">
                            {pastBookings.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν ολοκληρωμένα μαθήματα ακόμα.</p>
                            ) : (
                                pastBookings
                                    .sort((a, b) => new Date(b.lesson?.date) - new Date(a.lesson?.date))
                                    .map(b => renderBookingItem(b, true))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'new' && (
                    bookingPreset ? (
                        <div>
                            <button className="btn btn-sm" style={{ background: 'var(--ice)', color: 'var(--text-secondary)', marginBottom: '1rem' }}
                                onClick={() => setBookingPreset(null)}>
                                ← Πίσω στις σχολές
                            </button>
                            <NewBookingForm
                                presetSchoolId={bookingPreset.schoolId}
                                presetInstructorId={bookingPreset.instructorId || ''}
                                presetMode={bookingPreset.mode || 'individual'}
                                onBookingComplete={() => {
                                    fetchBookings()
                                    setBookingPreset(null)
                                    setActiveTab('bookings')
                                }} />
                        </div>
                    ) : (
                        <BookingFlow
                            onPickSchool={(school, mode, instructorId) => {
                                setBookingPreset({ schoolId: school.id, instructorId, mode })
                            }}
                            onBooked={() => {
                                fetchBookings()
                                setActiveTab('bookings')
                            }} />
                    )
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
                                {reviewModal.lesson?.instructor?.name && ` — 👨‍🏫 ${reviewModal.lesson.instructor.name}`}
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