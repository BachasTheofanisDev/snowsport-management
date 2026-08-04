import { useState, useEffect } from 'react'
import { bookLesson, getOpenGroups, joinOpenGroup } from '../api'
import LevelQuiz from './LevelQuiz'
import axios from 'axios'

function NewBookingForm({ onBookingComplete, presetSchoolId = '', presetMode = 'individual', hideTabs = false }) {
    const [schools, setSchools] = useState([])
    const [selectedSchool, setSelectedSchool] = useState(presetSchoolId)
    const [date, setDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [duration, setDuration] = useState(1)
    const [sport, setSport] = useState('ski')
    const [level, setLevel] = useState('beginner')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [persons, setPersons] = useState(1)
    const [bookingType, setBookingType] = useState(presetMode === 'open_group' ? 'open_group' : 'individual')
    const [openGroups, setOpenGroups] = useState([])
    const [showQuiz, setShowQuiz] = useState(false)

    // Φίλτρα ομαδικών
    const [filterDate, setFilterDate] = useState('')
    const [filterSport, setFilterSport] = useState('all')
    const [filterLevel, setFilterLevel] = useState('all')

    // Modal συμμετοχής σε ανοιχτό ομαδικό (με προτιμώμενες ώρες)
    const [joinModal, setJoinModal] = useState(null)
    const [preferredHours, setPreferredHours] = useState([])
    const [joinLoading, setJoinLoading] = useState(false)
    const [joinError, setJoinError] = useState('')

    const togglePreferredHour = (h) => {
        setPreferredHours(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])
    }

    const openJoinModal = (lesson) => {
        setPreferredHours([])
        setJoinError('')
        setJoinModal(lesson)
    }

    const handleJoinConfirm = async () => {
        if (preferredHours.length === 0) {
            setJoinError('Επίλεξε τουλάχιστον μία ώρα που σε βολεύει')
            return
        }
        setJoinLoading(true)
        setJoinError('')
        try {
            await joinOpenGroup(joinModal.id, preferredHours)
            setJoinModal(null)
            onBookingComplete()
        } catch (err) {
            setJoinError(err.response?.data?.error || 'Κάτι πήγε στραβά')
        } finally {
            setJoinLoading(false)
        }
    }

    const isPreset = !!presetSchoolId

    useEffect(() => {
        if (!isPreset) {
            axios.get('http://localhost:5000/api/customer/schools')
                .then(res => setSchools(res.data))
                .catch(err => console.error(err))
        }
    }, [isPreset])

    useEffect(() => {
        if (selectedSchool && bookingType === 'open_group') {
            getOpenGroups(selectedSchool)
                .then(res => setOpenGroups(res.data))
                .catch(err => console.error(err))
        }
    }, [selectedSchool, bookingType])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await bookLesson({
                date,
                startTime,
                duration: parseInt(duration),
                sport,
                level,
                schoolId: selectedSchool,
                instructorId: null,
                persons: parseInt(persons)
            })
            onBookingComplete()
        } catch (err) {
            setError(err.response?.data?.error || 'Κάτι πήγε στραβά')
        } finally {
            setLoading(false)
        }
    }

    const getValidStartTimes = (dur) => {
        const maxStart = 16 - parseInt(dur)
        const times = []
        for (let h = 9; h <= maxStart; h++) {
            times.push(`${h.toString().padStart(2, '0')}:00`)
        }
        return times
    }

    const calculatePrice = (persons, hours) => {
        let pricePerHour
        switch (persons) {
            case 1: pricePerHour = 50; break
            case 2: pricePerHour = 60; break
            case 3: pricePerHour = 75; break
            case 4: pricePerHour = 80; break
            default: pricePerHour = persons * 20; break
        }
        return pricePerHour * hours
    }

    // Φιλτράρισμα ομαδικών: κρύβει περασμένα + εφαρμόζει φίλτρα
    const todayStr = new Date().toISOString().split('T')[0]
    const filteredOpenGroups = openGroups.filter(lesson => {
        const lessonDate = new Date(lesson.date).toISOString().split('T')[0]
        // Κρύψε περασμένα
        if (lessonDate < todayStr) return false
        // Φίλτρο ημερομηνίας (αν έχει επιλεγεί)
        if (filterDate && lessonDate !== filterDate) return false
        // Φίλτρο άθλημα
        if (filterSport !== 'all' && lesson.sport !== filterSport) return false
        // Φίλτρο επίπεδο
        if (filterLevel !== 'all' && lesson.level !== filterLevel) return false
        return true
    })

    return (
        <div className="card">
            {showQuiz && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ width: '100%', maxWidth: 520, position: 'relative' }}>
                        <button onClick={() => setShowQuiz(false)}
                            style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer', zIndex: 1 }}>
                            ✕
                        </button>
                        <LevelQuiz onResult={(lvl) => { setLevel(lvl); setShowQuiz(false) }} />
                    </div>
                </div>
            )}
            <div className="card-header">
                <span className="card-title">{bookingType === 'open_group' ? '👥 Διαθέσιμα Ομαδικά' : '📝 Νέα Κράτηση'}</span>
            </div>
            <div className="card-body">
                {error && <div className="alert alert-error">{error}</div>}

                {!hideTabs && (
                    <div className="tabs" style={{ marginBottom: '1.5rem' }}>
                        <button className={`tab-btn ${bookingType === 'individual' ? 'active' : ''}`}
                            onClick={() => setBookingType('individual')}>
                            📝 Νέα Κράτηση
                        </button>
                        <button className={`tab-btn ${bookingType === 'open_group' ? 'active' : ''}`}
                            onClick={() => setBookingType('open_group')}>
                            👥 Διαθέσιμα Ομαδικά
                        </button>
                    </div>
                )}

                {!isPreset && (
                    <div className="form-group">
                        <label className="form-label">Σχολή</label>
                        <select className="form-select" value={selectedSchool}
                            onChange={e => { setSelectedSchool(e.target.value); setOpenGroups([]) }}
                            required>
                            <option value="">Επέλεξε σχολή</option>
                            {schools.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Ατομικό (χωρίς προτίμηση εκπαιδευτή → pending) */}
                {bookingType === 'individual' && (
                    <form onSubmit={handleSubmit}>
                        <div style={{ background: '#e0f2fe', border: '0.5px solid #7dd3fc', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: 13, color: '#075985' }}>
                            ℹ️ Η κράτηση θα καταχωρηθεί ως <strong>εκκρεμής</strong>. Η σχολή θα αναθέσει εκπαιδευτή και θα την επιβεβαιώσει.
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Ημερομηνία</label>
                                <input className="form-input" type="date" value={date}
                                    onChange={e => setDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Ώρα Έναρξης</label>
                                <select className="form-select" value={startTime} onChange={e => setStartTime(e.target.value)} required>
                                    <option value="">Επέλεξε ώρα</option>
                                    {getValidStartTimes(duration).map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Διάρκεια (ώρες)</label>
                                <select className="form-select" value={duration} onChange={e => { setDuration(e.target.value); setStartTime('') }}>
                                    {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                        <option key={d} value={d}>{d} ώρα{d > 1 ? 'ες' : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Άθλημα</label>
                                <select className="form-select" value={sport} onChange={e => setSport(e.target.value)}>
                                    <option value="ski">⛷️ Σκι</option>
                                    <option value="snowboard">🏂 Snowboard</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Επίπεδο
                                    <button type="button" onClick={() => setShowQuiz(true)}
                                        style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
                                        🤖 Δεν ξέρω το επίπεδό μου
                                    </button>
                                </label>
                                <select className="form-select" value={level} onChange={e => setLevel(e.target.value)}>
                                    <option value="beginner">Αρχάριος</option>
                                    <option value="intermediate">Μεσαίο</option>
                                    <option value="advanced">Προχωρημένο</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Αριθμός Ατόμων</label>
                                <select className="form-select" value={persons} onChange={e => setPersons(e.target.value)}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                        <option key={n} value={n}>{n} άτομο{n > 1 ? 'α' : ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ background: 'var(--ice)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', margin: '1rem 0' }}>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                Τύπος: {parseInt(persons) === 1 ? 'Ατομικό' : 'Ομαδικό (κλειστό)'} • Άτομα: {persons}
                            </p>
                            <p style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: 'var(--navy)' }}>
                                💰 Κόστος: {calculatePrice(parseInt(persons), parseInt(duration))}€
                            </p>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading || !selectedSchool}>
                            {loading ? 'Κράτηση...' : 'Επιβεβαίωση Κράτησης'}
                        </button>
                    </form>
                )}

                {/* Ανοιχτά ομαδικά */}
                {bookingType === 'open_group' && (
                    <div>
                        {!selectedSchool ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Επέλεξε σχολή για να δεις τα διαθέσιμα ομαδικά μαθήματα.</p>
                        ) : (
                            <>
                                {/* Φίλτρα */}
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'flex-end' }}>
                                    <div className="form-group" style={{ marginBottom: 0, flex: '1 1 140px' }}>
                                        <label className="form-label">📅 Ημερομηνία</label>
                                        <input className="form-input" type="date" value={filterDate}
                                            min={todayStr}
                                            onChange={e => setFilterDate(e.target.value)} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0, flex: '1 1 120px' }}>
                                        <label className="form-label">Άθλημα</label>
                                        <select className="form-select" value={filterSport} onChange={e => setFilterSport(e.target.value)}>
                                            <option value="all">Όλα</option>
                                            <option value="ski">⛷️ Σκι</option>
                                            <option value="snowboard">🏂 Snowboard</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0, flex: '1 1 120px' }}>
                                        <label className="form-label">Επίπεδο</label>
                                        <select className="form-select" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
                                            <option value="all">Όλα</option>
                                            <option value="beginner">Αρχάριος</option>
                                            <option value="intermediate">Μεσαίο</option>
                                            <option value="advanced">Προχωρημένο</option>
                                        </select>
                                    </div>
                                    {(filterDate || filterSport !== 'all' || filterLevel !== 'all') && (
                                        <button className="btn btn-sm" style={{ background: 'var(--ice)', color: 'var(--text-secondary)' }}
                                            onClick={() => { setFilterDate(''); setFilterSport('all'); setFilterLevel('all') }}>
                                            Καθαρισμός
                                        </button>
                                    )}
                                </div>

                                {filteredOpenGroups.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν διαθέσιμα ομαδικά μαθήματα με αυτά τα κριτήρια.</p>
                                ) : (
                                    filteredOpenGroups.map(lesson => {
                                        const filled = lesson.bookings.length
                                        const progress = Math.min((filled / lesson.maxPersons) * 100, 100)
                                        const reachedMin = filled >= lesson.minPersons
                                        return (
                                        <div key={lesson.id} className="lesson-item" style={{ marginBottom: '1rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <div className="lesson-sport">
                                                    {lesson.sport === 'ski' ? '⛷️' : '🏂'} {lesson.duration} ώρ.
                                                    {lesson.startTime
                                                        ? <span className="badge badge-confirmed" style={{ marginLeft: 8 }}>🕐 {lesson.startTime}</span>
                                                        : <span className="badge badge-pending" style={{ marginLeft: 8 }}>Ώρα κατόπιν συνεννόησης</span>}
                                                </div>
                                                <div className="lesson-meta">
                                                    📅 {new Date(lesson.date).toLocaleDateString('el-GR')} &nbsp;
                                                    👨‍🏫 {lesson.instructor?.name || 'Αναμένεται'} &nbsp;
                                                    📊 {lesson.level === 'beginner' ? 'Αρχάριος' : lesson.level === 'intermediate' ? 'Μεσαίο' : 'Προχωρημένο'}
                                                </div>
                                                <div style={{ marginTop: 6, fontSize: 13 }}>
                                                    <span className="badge badge-pending">
                                                        👥 {filled}/{lesson.maxPersons} θέσεις
                                                    </span>
                                                    <span style={{ marginLeft: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
                                                        Min: {lesson.minPersons} άτομα • 💰 {20 * lesson.duration}€/άτομο
                                                    </span>
                                                </div>

                                                {/* Μπάρα προόδου */}
                                                <div style={{ marginTop: 8, marginBottom: 4 }}>
                                                    <div style={{ height: 8, background: 'var(--ice)', borderRadius: 100, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${progress}%`, background: reachedMin ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: 100, transition: 'width 0.4s' }} />
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                                                        {reachedMin ? `✅ Συμπληρώθηκε το ελάχιστο!` : `⏳ Αναμένει ${lesson.minPersons - filled} ακόμα`}
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                    ⚠️ Αν δεν συμπληρωθούν {lesson.minPersons} άτομα, η διαφορά καταβάλλεται επιτόπου
                                                </div>
                                            </div>
                                            <button className="btn btn-primary btn-sm"
                                                onClick={() => openJoinModal(lesson)}>
                                                Κράτηση Θέσης
                                            </button>
                                        </div>
                                        )
                                    })
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Modal επιλογής προτιμώμενων ωρών */}
            {joinModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}
                    onClick={() => setJoinModal(null)}>
                    <div className="card" style={{ width: '100%', maxWidth: 480 }}
                        onClick={e => e.stopPropagation()}>
                        <div className="card-header" style={{ background: 'var(--navy)', color: 'white' }}>
                            <span className="card-title" style={{ color: 'white' }}>👥 Κράτηση Θέσης</span>
                            <button onClick={() => setJoinModal(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18 }}>✕</button>
                        </div>
                        <div className="card-body">
                            {joinError && <div className="alert alert-error">{joinError}</div>}

                            <div style={{ background: 'var(--ice)', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: 13 }}>
                                <div style={{ fontWeight: 600 }}>
                                    {joinModal.sport === 'ski' ? '⛷️' : '🏂'} {joinModal.duration} ώρ. — {joinModal.level === 'beginner' ? 'Αρχάριος' : joinModal.level === 'intermediate' ? 'Μεσαίο' : 'Προχωρημένο'}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                                    📅 {new Date(joinModal.date).toLocaleDateString('el-GR')} • 💰 {20 * joinModal.duration}€
                                </div>
                            </div>

                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                🕐 Ποιες ώρες σε βολεύουν;
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                                Επίλεξε όσες ώρες μπορείς. Η σχολή θα ορίσει την τελική ώρα βάσει των προτιμήσεων όλων.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8, marginBottom: '1.25rem' }}>
                                {(() => {
                                    const maxStart = 16 - joinModal.duration
                                    const hours = []
                                    for (let h = 9; h <= maxStart; h++) hours.push(h)
                                    return hours.map(h => {
                                        const timeStr = `${h.toString().padStart(2, '0')}:00`
                                        const selected = preferredHours.includes(h)
                                        return (
                                            <button key={h}
                                                onClick={() => togglePreferredHour(h)}
                                                style={{
                                                    padding: '10px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                                    border: selected ? '2px solid #0284c7' : '1px solid var(--border)',
                                                    background: selected ? '#e0f2fe' : '#fff',
                                                    color: selected ? '#0284c7' : 'var(--text-secondary)'
                                                }}>
                                                {selected ? '✓ ' : ''}{timeStr}
                                            </button>
                                        )
                                    })
                                })()}
                            </div>

                            <div style={{ background: '#fef3c7', border: '0.5px solid #f59e0b', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: 12, color: '#92400e' }}>
                                ⚠️ Αν δεν συμπληρωθούν {joinModal.minPersons} άτομα, η διαφορά καταβάλλεται επιτόπου στη σχολή.
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                                onClick={handleJoinConfirm} disabled={joinLoading}>
                                {joinLoading ? 'Κράτηση...' : `Επιβεβαίωση Κράτησης (${20 * joinModal.duration}€)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default NewBookingForm