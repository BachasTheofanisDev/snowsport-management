import { useState, useEffect } from 'react'
import { getAvailableSlots, bookLesson, getOpenGroups, joinOpenGroup } from '../api'
import axios from 'axios'

function NewBookingForm({ onBookingComplete }) {
    const [schools, setSchools] = useState([])
    const [selectedSchool, setSelectedSchool] = useState('')
    const [date, setDate] = useState('')
    const [slots, setSlots] = useState([])
    const [selectedInstructor, setSelectedInstructor] = useState('')
    const [startTime, setStartTime] = useState('')
    const [duration, setDuration] = useState(1)
    const [sport, setSport] = useState('ski')
    const [level, setLevel] = useState('beginner')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [persons, setPersons] = useState(1)
    const [bookingType, setBookingType] = useState('individual') // 'individual' | 'open_group'
    const [openGroups, setOpenGroups] = useState([])

    useEffect(() => {
        // Φόρτωσε τις σχολές
        axios.get('http://localhost:5000/api/customer/schools')
            .then(res => setSchools(res.data))
            .catch(err => console.error(err))
    }, [])

    useEffect(() => {
        if (date && selectedSchool) {
            getAvailableSlots(date, selectedSchool)
                .then(res => setSlots(res.data))
                .catch(err => console.error(err))
        }
    }, [date, selectedSchool])

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
                instructorId: selectedInstructor || null,
                persons: parseInt(persons)
            })
            onBookingComplete()
        } catch (err) {
            setError(err.response?.data?.error || 'Κάτι πήγε στραβά')
        } finally {
            setLoading(false)
        }
    }

    const getAvailableStartTimes = () => {
        if (!selectedInstructor) return []
        const instructor = slots.find(s => s.id === selectedInstructor)
        if (!instructor) return []
        return instructor.availableHours.map(h => `${h.toString().padStart(2, '0')}:00`)
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

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">Νέα Κράτηση</span>
            </div>
            <div className="card-body">
                {error && <div className="alert alert-error">{error}</div>}

                {/* Tabs */}
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

                {/* Επιλογή Σχολής (κοινό και για τα δύο) */}
                <div className="form-group">
                    <label className="form-label">Σχολή</label>
                    <select className="form-select" value={selectedSchool}
                        onChange={e => { setSelectedSchool(e.target.value); setSlots([]); setSelectedInstructor(''); setOpenGroups([]) }}
                        required>
                        <option value="">Επέλεξε σχολή</option>
                        {schools.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {/* Ατομικό */}
                {bookingType === 'individual' && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Ημερομηνία</label>
                                <input className="form-input" type="date" value={date}
                                    onChange={e => { setDate(e.target.value); setSlots([]); setSelectedInstructor('') }}
                                    min={new Date().toISOString().split('T')[0]} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Άθλημα</label>
                                <select className="form-select" value={sport} onChange={e => setSport(e.target.value)}>
                                    <option value="ski">⛷️ Σκι</option>
                                    <option value="snowboard">🏂 Snowboard</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Επίπεδο</label>
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

                        {slots.length > 0 && (
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Εκπαιδευτής (προαιρετικό)</label>
                                    <select className="form-select" value={selectedInstructor}
                                        onChange={e => { setSelectedInstructor(e.target.value); setStartTime('') }}>
                                        <option value="">-- Χωρίς προτίμηση --</option>
                                        {slots.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.availableHours.length} ελεύθερες ώρες)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedInstructor && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Ώρα Έναρξης</label>
                                            <select className="form-select" value={startTime} onChange={e => setStartTime(e.target.value)} required>
                                                <option value="">Επέλεξε ώρα</option>
                                                {getAvailableStartTimes().map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Διάρκεια (ώρες)</label>
                                            <select className="form-select" value={duration} onChange={e => setDuration(e.target.value)}>
                                                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                                    <option key={d} value={d}>{d} ώρα{d > 1 ? 'ες' : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {startTime && (
                            <div style={{ background: 'var(--ice)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                                <p style={{ fontSize: 13 }}><strong>Τύπος:</strong> {parseInt(persons) === 1 ? 'Ατομικό' : 'Ομαδικό'} • <strong>Άτομα:</strong> {persons}</p>
                                <p style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>
                                    Συνολικό κόστος: {calculatePrice(parseInt(persons), parseInt(duration))}€
                                </p>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" disabled={loading || !selectedSchool}>
                            {loading ? 'Κράτηση...' : 'Επιβεβαίωση Κράτησης'}
                        </button>
                    </form>
                )}

                {/* Ομαδικό */}
                {bookingType === 'open_group' && (
                    <div>
                        {!selectedSchool ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Επέλεξε σχολή για να δεις τα διαθέσιμα ομαδικά μαθήματα.</p>
                        ) : openGroups.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν διαθέσιμα ομαδικά μαθήματα.</p>
                        ) : (
                            openGroups.map(lesson => (
                                <div key={lesson.id} className="lesson-item" style={{ marginBottom: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div className="lesson-sport">
                                            {lesson.sport === 'ski' ? '⛷️' : '🏂'} {lesson.startTime} — {lesson.duration} ώρ.
                                        </div>
                                        <div className="lesson-meta">
                                            📅 {new Date(lesson.date).toLocaleDateString('el-GR')} &nbsp;
                                            👨‍🏫 {lesson.instructor?.name || 'Αναμένεται'} &nbsp;
                                            📊 {lesson.level === 'beginner' ? 'Αρχάριος' : lesson.level === 'intermediate' ? 'Μεσαίο' : 'Προχωρημένο'}
                                        </div>
                                        <div style={{ marginTop: 6, fontSize: 13 }}>
                                            <span className="badge badge-pending">
                                                👥 {lesson.bookings.length}/{lesson.maxPersons} θέσεις
                                            </span>
                                            <span style={{ marginLeft: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
                                                Min: {lesson.minPersons} άτομα • 💰 {20 * lesson.duration}€/άτομο
                                            </span>
                                        </div>
                                        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                            ⚠️ Αν δεν συμπληρωθούν {lesson.minPersons} άτομα, η διαφορά καταβάλλεται επιτόπου
                                        </div>
                                    </div>
                                    <button className="btn btn-primary btn-sm"
                                        onClick={async () => {
                                            if (!window.confirm(`Επιβεβαίωση κράτησης;\n\nΤιμή: ${20 * lesson.duration}€\n\n⚠️ Αν δεν συμπληρωθούν ${lesson.minPersons} άτομα, η διαφορά καταβάλλεται επιτόπου στη σχολή.`)) return
                                            try {
                                                await joinOpenGroup(lesson.id)
                                                onBookingComplete()
                                            } catch (err) {
                                                alert(err.response?.data?.error || 'Κάτι πήγε στραβά')
                                            }
                                        }}>
                                        Κράτηση Θέσης
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default NewBookingForm