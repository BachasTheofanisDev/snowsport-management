import { useState, useEffect } from 'react'
import { getResorts, getResortSchools, getSchoolInstructors, getResortInfo, getSchoolInfo, getInstructorAvailability, bookLesson } from '../api'
import LevelQuiz from './LevelQuiz'
import NewBookingForm from './NewBookingForm'

const img = (path) => path ? `http://localhost:5000${path}` : null

function BookingFlow({ onPickSchool, onBooked }) {
    const [step, setStep] = useState('resorts') // 'resorts' | 'schools'
    const [resorts, setResorts] = useState([])
    const [schools, setSchools] = useState([])
    const [selectedResort, setSelectedResort] = useState(null)
    const [selectedSchool, setSelectedSchool] = useState(null)
    const [instructors, setInstructors] = useState([])
    const [infoModal, setInfoModal] = useState(null) // πληροφορίες χιονοδρομικού
    const [schoolInfoModal, setSchoolInfoModal] = useState(null)
    const [instructorModal, setInstructorModal] = useState(null)
    const [availDate, setAvailDate] = useState(new Date().toISOString().split('T')[0])
    const [bookingModal, setBookingModal] = useState(null) // { instructorId, instructorName, date, time }
    const [bookForm, setBookForm] = useState({ sport: 'ski', level: 'beginner', duration: 1, persons: 1 })
    const [bookLoading, setBookLoading] = useState(false)
    const [bookError, setBookError] = useState('')
    const [showQuiz, setShowQuiz] = useState(false)
    const [bookingFormModal, setBookingFormModal] = useState(null) // { mode }

    useEffect(() => {
        getResorts().then(res => setResorts(res.data)).catch(console.error)
    }, [])

    const pickResort = async (resort) => {
        setSelectedResort(resort)
        try {
            const res = await getResortSchools(resort.id)
            setSchools(res.data)
            setStep('schools')
        } catch (err) { console.error(err) }
    }

    const showResortInfo = async (e, resortId) => {
        e.stopPropagation() // να μην ενεργοποιηθεί το pickResort
        try {
            const res = await getResortInfo(resortId)
            setInfoModal(res.data)
        } catch (err) { console.error(err) }
    }

    const showSchoolInfo = async (e, schoolId) => {
        e.stopPropagation()
        try {
            const res = await getSchoolInfo(schoolId)
            setSchoolInfoModal(res.data)
        } catch (err) { console.error(err) }
    }

    const pickSchool = async (school) => {
        setSelectedSchool(school)
        try {
            const res = await getSchoolInstructors(school.id)
            setInstructors(res.data)
            setStep('school')
        } catch (err) { console.error(err) }
    }

    // Κάρτα με banner
    const Card = ({ image, title, subtitle, onClick, fallback, onInfo }) => (
        <div onClick={onClick} style={{
            cursor: 'pointer', borderRadius: 16, overflow: 'hidden',
            border: '1px solid var(--border)', background: '#fff',
            boxShadow: '0 2px 12px rgba(12,39,64,0.06)', transition: 'transform 0.15s, box-shadow 0.15s'
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(12,39,64,0.14)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(12,39,64,0.06)' }}>
            <div style={{
                position: 'relative',
                height: 140,
                background: image
                    ? `url(${image}) center/cover`
                    : 'linear-gradient(135deg, #0c2740 0%, #0284c7 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40
            }}>
                {!image && fallback}
                {onInfo && (
                    <button onClick={onInfo}
                        style={{
                            position: 'absolute', top: 10, right: 10,
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.9)', border: 'none',
                            color: '#0c2740', cursor: 'pointer', fontSize: 16, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                        title="Πληροφορίες">
                        ⓘ
                    </button>
                )}
            </div>
            <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
                {subtitle && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{subtitle}</div>}
            </div>
        </div>
    )

    const openInstructorModal = async (instructorId, date) => {
        try {
            const res = await getInstructorAvailability(instructorId, date)
            setInstructorModal(res.data)
        } catch (err) { console.error(err) }
    }

    const handleInstructorClick = (instructor) => {
        const today = new Date().toISOString().split('T')[0]
        setAvailDate(today)
        openInstructorModal(instructor.id, today)
    }

    const handleAvailDateChange = (newDate) => {
        setAvailDate(newDate)
        if (instructorModal) {
            openInstructorModal(instructorModal.id, newDate)
        }
    }

    const calcPrice = (persons, hours) => {
        let perHour
        switch (persons) {
            case 1: perHour = 50; break
            case 2: perHour = 60; break
            case 3: perHour = 75; break
            case 4: perHour = 80; break
            default: perHour = persons * 20; break
        }
        return perHour * hours
    }

    const handleConfirmBooking = async () => {
        setBookLoading(true)
        setBookError('')
        try {
            await bookLesson({
                date: bookingModal.date,
                startTime: bookingModal.time,
                duration: parseInt(bookForm.duration),
                sport: bookForm.sport,
                level: bookForm.level,
                schoolId: selectedSchool.id,
                instructorId: bookingModal.instructorId,
                persons: parseInt(bookForm.persons)
            })
            setBookingModal(null)
            setBookForm({ sport: 'ski', level: 'beginner', duration: 1, persons: 1 })
            if (onBooked) onBooked()
        } catch (err) {
            setBookError(err.response?.data?.error || 'Κάτι πήγε στραβά')
        } finally {
            setBookLoading(false)
        }
    }

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">
                    {step === 'resorts' ? '🏔 Επίλεξε Χιονοδρομικό'
                        : step === 'schools' ? `🎿 Σχολές — ${selectedResort?.name}`
                            : `🏫 ${selectedSchool?.name}`}
                </span>
                {step === 'schools' && (
                    <button className="btn btn-sm" style={{ background: 'var(--ice)', color: 'var(--text-secondary)' }}
                        onClick={() => setStep('resorts')}>
                        ← Πίσω
                    </button>
                )}
                {step === 'school' && (
                    <button className="btn btn-sm" style={{ background: 'var(--ice)', color: 'var(--text-secondary)' }}
                        onClick={() => setStep('schools')}>
                        ← Πίσω
                    </button>
                )}
            </div>

            <div className="card-body">
                {step === 'resorts' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                        {resorts.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν χιονοδρομικά.</p>
                        ) : (
                            resorts.map(r => (
                                <Card key={r.id}
                                    image={img(r.image)}
                                    title={r.name}
                                    subtitle={`🎿 ${r._count.schools} σχολές`}
                                    fallback="🏔"
                                    onClick={() => pickResort(r)}
                                    onInfo={(e) => showResortInfo(e, r.id)} />
                            ))
                        )}
                    </div>
                )}

                {step === 'schools' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                        {schools.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν διαθέσιμες σχολές.</p>
                        ) : (
                            schools.map(s => (
                                <Card key={s.id}
                                    image={img(s.image)}
                                    title={s.name}
                                    subtitle={`👨‍🏫 ${s.instructors.length} εκπαιδευτές${s.avgRating > 0 ? ` • ⭐ ${s.avgRating}` : ''}`}
                                    fallback="🎿"
                                    onClick={() => pickSchool(s)}
                                    onInfo={(e) => showSchoolInfo(e, s.id)} />
                            ))
                        )}
                    </div>
                )}
                {step === 'school' && (
                    <div>
                        {/* Κουμπιά κράτησης */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" onClick={() => setBookingFormModal({ mode: 'individual' })}>
                                📝 Νέα Κράτηση
                            </button>
                            <button className="btn btn-success" onClick={() => setBookingFormModal({ mode: 'open_group' })}>
                                👥 Διαθέσιμα Ομαδικά
                            </button>
                        </div>

                        {/* Εκπαιδευτές */}
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: '1rem', color: 'var(--navy)' }}>
                            👨‍🏫 Εκπαιδευτές
                        </div>
                        {instructors.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν εκπαιδευτές.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                                {instructors.map(i => (
                                    <div key={i.id} style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
                                        <div style={{
                                            height: 100,
                                            background: i.image ? `url(${img(i.image)}) center/cover` : 'linear-gradient(135deg, #0284c7, #0c2740)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36
                                        }}>
                                            {!i.image && '👨‍🏫'}
                                        </div>
                                        <div style={{ padding: '0.9rem 1rem' }}>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{i.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                                                {i.specialty.map(s => s === 'ski' ? '⛷️ Σκι' : '🏂 Snowboard').join(' • ')}
                                            </div>
                                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                                {i.avgRating > 0
                                                    ? <span style={{ color: '#f59e0b' }}>★ {i.avgRating} ({i.totalReviews})</span>
                                                    : <span style={{ color: 'var(--text-secondary)' }}>Χωρίς αξιολογήσεις</span>}
                                            </div>
                                            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}
                                                onClick={() => handleInstructorClick(i)}>
                                                Διαθεσιμότητα & Κράτηση
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>

            {infoModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
                    onClick={() => setInfoModal(null)}>
                    <div className="card" style={{ width: '100%', maxWidth: 680, maxHeight: '88vh', overflow: 'auto' }}
                        onClick={e => e.stopPropagation()}>
                        {/* Banner */}
                        <div style={{
                            height: 200, position: 'relative',
                            background: infoModal.image
                                ? `linear-gradient(180deg, rgba(8,20,35,0.2), rgba(8,20,35,0.7)), url(http://localhost:5000${infoModal.image}) center/cover`
                                : 'linear-gradient(135deg, #0c2740 0%, #0284c7 100%)'
                        }}>
                            <button onClick={() => setInfoModal(null)}
                                style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                                ✕
                            </button>
                            <div style={{ position: 'absolute', bottom: 16, left: 20, color: '#fff' }}>
                                <h2 style={{ fontSize: 26, fontWeight: 700, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>🏔 {infoModal.name}</h2>
                                {infoModal.location && <p style={{ fontSize: 14, opacity: 0.95, textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>📍 {infoModal.location}</p>}
                            </div>
                        </div>

                        <div className="card-body">
                            {/* Περιγραφή */}
                            {infoModal.description && (
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                                    {infoModal.description}
                                </p>
                            )}

                            {/* Στατιστικά */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                {infoModal.baseAltitude != null && (
                                    <div style={{ background: 'var(--ice)', borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Υψόμετρο Βάσης</div>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>{infoModal.baseAltitude}μ</div>
                                    </div>
                                )}
                                {infoModal.peakAltitude != null && (
                                    <div style={{ background: 'var(--ice)', borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Υψόμετρο Κορυφής</div>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>{infoModal.peakAltitude}μ</div>
                                    </div>
                                )}
                                {infoModal.liftsCount > 0 && (
                                    <div style={{ background: 'var(--ice)', borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Αναβατήρες</div>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>🚡 {infoModal.liftsCount}</div>
                                    </div>
                                )}
                                {infoModal.totalSlopeLength > 0 && (
                                    <div style={{ background: 'var(--ice)', borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Μήκος Πιστών</div>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>{infoModal.totalSlopeLength} χλμ</div>
                                    </div>
                                )}
                            </div>

                            {/* Πίστες ανά χρώμα */}
                            {(infoModal.slopesGreen + infoModal.slopesBlue + infoModal.slopesRed + infoModal.slopesBlack) > 0 && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>⛷️ Πίστες</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {infoModal.slopesGreen > 0 && <span style={{ background: '#d1fae5', color: '#059669', padding: '4px 12px', borderRadius: 100, fontSize: 13, fontWeight: 600 }}>🟢 {infoModal.slopesGreen} Πράσινες</span>}
                                        {infoModal.slopesBlue > 0 && <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 12px', borderRadius: 100, fontSize: 13, fontWeight: 600 }}>🔵 {infoModal.slopesBlue} Μπλε</span>}
                                        {infoModal.slopesRed > 0 && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: 100, fontSize: 13, fontWeight: 600 }}>🔴 {infoModal.slopesRed} Κόκκινες</span>}
                                        {infoModal.slopesBlack > 0 && <span style={{ background: '#e5e7eb', color: '#1a1a1a', padding: '4px 12px', borderRadius: 100, fontSize: 13, fontWeight: 600 }}>⚫ {infoModal.slopesBlack} Μαύρες</span>}
                                    </div>
                                </div>
                            )}

                            {/* Επικοινωνία */}
                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', fontSize: 13, color: 'var(--text-secondary)' }}>
                                {infoModal.phone && <span>📞 {infoModal.phone}</span>}
                                {infoModal.openingHours && <span>🕐 {infoModal.openingHours}</span>}
                            </div>

                            {/* Χάρτης */}
                            {infoModal.mapImage && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🗺 Χάρτης Πιστών</div>
                                    <img src={`http://localhost:5000${infoModal.mapImage}`} alt="Χάρτης" style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)' }} />
                                </div>
                            )}

                            {/* Gallery */}
                            {infoModal.gallery && infoModal.gallery.length > 0 && (
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📸 Φωτογραφίες</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                                        {infoModal.gallery.map((img, idx) => (
                                            <div key={idx} style={{ height: 100, borderRadius: 8, background: `url(http://localhost:5000${img}) center/cover`, border: '1px solid var(--border)' }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {schoolInfoModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
                    onClick={() => setSchoolInfoModal(null)}>
                    <div className="card" style={{ width: '100%', maxWidth: 680, maxHeight: '88vh', overflow: 'auto' }}
                        onClick={e => e.stopPropagation()}>
                        {/* Banner */}
                        <div style={{
                            height: 200, position: 'relative',
                            background: schoolInfoModal.image
                                ? `linear-gradient(180deg, rgba(8,20,35,0.2), rgba(8,20,35,0.7)), url(http://localhost:5000${schoolInfoModal.image}) center/cover`
                                : 'linear-gradient(135deg, #0c2740 0%, #0284c7 100%)'
                        }}>
                            <button onClick={() => setSchoolInfoModal(null)}
                                style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                                ✕
                            </button>
                            <div style={{ position: 'absolute', bottom: 16, left: 20, color: '#fff' }}>
                                <h2 style={{ fontSize: 26, fontWeight: 700, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>🎿 {schoolInfoModal.name}</h2>
                                <p style={{ fontSize: 14, opacity: 0.95, textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
                                    {schoolInfoModal.resort?.name && `🏔 ${schoolInfoModal.resort.name}`}
                                    {schoolInfoModal.totalReviews > 0 && ` • ⭐ ${schoolInfoModal.avgRating} (${schoolInfoModal.totalReviews} αξιολογήσεις)`}
                                </p>
                            </div>
                        </div>

                        <div className="card-body">
                            {/* Περιγραφή */}
                            {schoolInfoModal.description && (
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                                    {schoolInfoModal.description}
                                </p>
                            )}

                            {/* Επικοινωνία (κληρονομημένα από χιονοδρομικό) */}
                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', fontSize: 13, color: 'var(--text-secondary)' }}>
                                {schoolInfoModal.phone && <span>📞 {schoolInfoModal.phone}</span>}
                                {schoolInfoModal.resort?.location && <span>📍 {schoolInfoModal.resort.location}</span>}
                                {schoolInfoModal.resort?.openingHours && <span>🕐 {schoolInfoModal.resort.openingHours}</span>}
                            </div>

                            {/* Χάρτης (κληρονομημένος) */}
                            {schoolInfoModal.resort?.mapImage && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🗺 Χάρτης Πιστών</div>
                                    <img src={`http://localhost:5000${schoolInfoModal.resort.mapImage}`} alt="Χάρτης" style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)' }} />
                                </div>
                            )}

                            {/* Gallery σχολής */}
                            {schoolInfoModal.gallery && schoolInfoModal.gallery.length > 0 && (
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📸 Φωτογραφίες</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                                        {schoolInfoModal.gallery.map((img, idx) => (
                                            <div key={idx} style={{ height: 100, borderRadius: 8, background: `url(http://localhost:5000${img}) center/cover`, border: '1px solid var(--border)' }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {instructorModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
                    onClick={() => setInstructorModal(null)}>
                    <div className="card" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto' }}
                        onClick={e => e.stopPropagation()}>
                        {/* Banner */}
                        <div style={{
                            height: 180, position: 'relative',
                            background: instructorModal.image
                                ? `linear-gradient(180deg, rgba(8,20,35,0.2), rgba(8,20,35,0.75)), url(http://localhost:5000${instructorModal.image}) center/cover`
                                : 'linear-gradient(135deg, #0284c7, #0c2740)'
                        }}>
                            <button onClick={() => setInstructorModal(null)}
                                style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                                ✕
                            </button>
                            <div style={{ position: 'absolute', bottom: 16, left: 20, color: '#fff' }}>
                                <h2 style={{ fontSize: 24, fontWeight: 700, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>👨‍🏫 {instructorModal.name}</h2>
                                <p style={{ fontSize: 13, opacity: 0.95, textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
                                    {instructorModal.specialty.map(s => s === 'ski' ? '⛷️ Σκι' : '🏂 Snowboard').join(' • ')}
                                    {instructorModal.avgRating > 0 && ` • ★ ${instructorModal.avgRating} (${instructorModal.totalReviews})`}
                                </p>
                            </div>
                        </div>

                        <div className="card-body">
                            {/* Περιγραφή */}
                            {instructorModal.description && (
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                                    {instructorModal.description}
                                </p>
                            )}

                            {/* Αξιολογήσεις */}
                            {instructorModal.reviews.length > 0 && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>⭐ Αξιολογήσεις</div>
                                    {instructorModal.reviews.slice(0, 3).map((r, idx) => (
                                        <div key={idx} style={{ fontSize: 12, padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
                                            <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}</span>
                                            <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>{r.customer.name}</span>
                                            {r.comment && <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>— "{r.comment}"</span>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Date picker */}
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📅 Επίλεξε Ημερομηνία</div>
                                <input className="form-input" type="date" value={availDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => handleAvailDateChange(e.target.value)}
                                    style={{ width: 'auto' }} />
                            </div>

                            {/* Grid ωρών */}
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🕐 Διαθέσιμες Ώρες</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.5rem' }}>
                                    {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'].map(time => {
                                        const hour = parseInt(time.split(':')[0])
                                        const isBooked = instructorModal.bookedHours.includes(hour)
                                        return (
                                            <button key={time}
                                                disabled={isBooked}
                                                onClick={() => {
                                                    setBookingModal({
                                                        instructorId: instructorModal.id,
                                                        instructorName: instructorModal.name,
                                                        date: availDate,
                                                        time: time
                                                    })
                                                    setInstructorModal(null)
                                                }} style={{
                                                    padding: '12px', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 14,
                                                    cursor: isBooked ? 'not-allowed' : 'pointer',
                                                    background: isBooked ? '#e5e7eb' : '#d1fae5',
                                                    color: isBooked ? '#9ca3af' : '#059669',
                                                    textDecoration: isBooked ? 'line-through' : 'none'
                                                }}>
                                                {time}
                                            </button>
                                        )
                                    })}
                                </div>
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 12 }}>
                                    🟢 Διαθέσιμη ώρα — κλικ για κράτηση &nbsp;•&nbsp; ⬜ Κατειλημμένη
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {bookingModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
                    onClick={() => setBookingModal(null)}>
                    <div className="card" style={{ width: '100%', maxWidth: 480 }}
                        onClick={e => e.stopPropagation()}>
                        <div className="card-header" style={{ background: 'var(--navy)', color: 'white' }}>
                            <span className="card-title" style={{ color: 'white' }}>Επιβεβαίωση Κράτησης</span>
                            <button onClick={() => setBookingModal(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18 }}>✕</button>
                        </div>
                        <div className="card-body">
                            {bookError && <div className="alert alert-error">{bookError}</div>}

                            {/* Επιλεγμένα στοιχεία */}
                            <div style={{ background: 'var(--ice)', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: 13 }}>
                                <div style={{ fontWeight: 600 }}>👨‍🏫 {bookingModal.instructorName}</div>
                                <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                                    📅 {new Date(bookingModal.date).toLocaleDateString('el-GR')} &nbsp;•&nbsp; 🕐 {bookingModal.time}
                                </div>
                            </div>

                            {/* Πεδία */}
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Άθλημα</label>
                                    <select className="form-select" value={bookForm.sport}
                                        onChange={e => setBookForm({ ...bookForm, sport: e.target.value })}>
                                        <option value="ski">⛷️ Σκι</option>
                                        <option value="snowboard">🏂 Snowboard</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Επίπεδο
                                        <button type="button" onClick={() => setShowQuiz(true)}
                                            style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
                                            🤖 Δεν ξέρω
                                        </button>
                                    </label>
                                    <select className="form-select" value={bookForm.level}
                                        onChange={e => setBookForm({ ...bookForm, level: e.target.value })}>
                                        <option value="beginner">Αρχάριος</option>
                                        <option value="intermediate">Μεσαίο</option>
                                        <option value="advanced">Προχωρημένο</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Διάρκεια (ώρες)</label>
                                    <select className="form-select" value={bookForm.duration}
                                        onChange={e => setBookForm({ ...bookForm, duration: e.target.value })}>
                                        {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                            <option key={d} value={d}>{d} ώρα{d > 1 ? 'ες' : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Αριθμός Ατόμων</label>
                                    <select className="form-select" value={bookForm.persons}
                                        onChange={e => setBookForm({ ...bookForm, persons: e.target.value })}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                            <option key={n} value={n}>{n} άτομο{n > 1 ? 'α' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Κόστος */}
                            <div style={{ background: 'var(--ice)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '0.75rem 1rem', margin: '1rem 0' }}>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                    Τύπος: {parseInt(bookForm.persons) === 1 ? 'Ατομικό' : 'Ομαδικό'} • Άτομα: {bookForm.persons}
                                </span>
                                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: 'var(--navy)' }}>
                                    💰 Κόστος: {calcPrice(parseInt(bookForm.persons), parseInt(bookForm.duration))}€
                                </div>
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                                onClick={handleConfirmBooking} disabled={bookLoading}>
                                {bookLoading ? 'Κράτηση...' : 'Επιβεβαίωση Κράτησης'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {bookingFormModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflow: 'auto' }}
                    onClick={() => setBookingFormModal(null)}>
                    <div style={{ width: '100%', maxWidth: 640, marginTop: '2rem', position: 'relative' }}
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => setBookingFormModal(null)}
                            style={{ position: 'absolute', top: -36, right: 0, background: 'none', border: 'none', color: 'white', fontSize: 26, cursor: 'pointer', zIndex: 1 }}>
                            ✕
                        </button>
                        <NewBookingForm
                            presetSchoolId={selectedSchool.id}
                            presetMode={bookingFormModal.mode}
                            hideTabs={true}
                            onBookingComplete={() => {
                                setBookingFormModal(null)
                                if (onBooked) onBooked()
                            }} />
                    </div>
                </div>
            )}
            {/* AI Quiz */}
            {showQuiz && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
                    <div style={{ width: '100%', maxWidth: 520, position: 'relative' }}>
                        <button onClick={() => setShowQuiz(false)}
                            style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer', zIndex: 1 }}>
                            ✕
                        </button>
                        <LevelQuiz onResult={(lvl) => { setBookForm({ ...bookForm, level: lvl }); setShowQuiz(false) }} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default BookingFlow