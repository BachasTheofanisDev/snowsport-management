import { useState, useEffect } from 'react'
import axios from 'axios'
import { moveLesson, unassignInstructor } from '../api'

const HOURS = [9, 10, 11, 12, 13, 14, 15]

const getColor = (status) => {
    switch (status) {
        case 'confirmed': return { bg: '#d4edda', border: '#28a745', text: '#155724' }
        case 'pending': return { bg: '#fff3cd', border: '#ffc107', text: '#856404' }
        case 'cancelled': return { bg: '#f8d7da', border: '#dc3545', text: '#721c24' }
        default: return { bg: 'var(--ice)', border: 'var(--border)', text: 'var(--text-secondary)' }
    }
}

function ScheduleGrid({ schoolId, token, onLessonMoved, date: dateProp, onDateChange }) {
    const [dateInternal, setDateInternal] = useState(new Date().toISOString().split('T')[0])
    const date = dateProp !== undefined ? dateProp : dateInternal
    const setDate = onDateChange || setDateInternal
    const [instructors, setInstructors] = useState([])
    const [lessons, setLessons] = useState([])
    const [loading, setLoading] = useState(false)
    const [lessonModal, setLessonModal] = useState(null)
    const [dragOver, setDragOver] = useState(null)
    const [panelDragOver, setPanelDragOver] = useState(false)
    const [moveError, setMoveError] = useState('')

    useEffect(() => {
        if (date && schoolId) fetchData()
    }, [date])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [instructorsRes, lessonsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/school/instructors', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`http://localhost:5000/api/lessons/schedule?date=${date}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ])
            setInstructors(instructorsRes.data)
            setLessons(lessonsRes.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getLessonForSlot = (instructorId, hour) => {
        return lessons.find(lesson => {
            if (lesson.instructorId !== instructorId) return false
            if (!lesson.startTime) return false
            const startHour = parseInt(lesson.startTime.split(':')[0])
            const endHour = startHour + lesson.duration
            return hour >= startHour && hour < endHour
        })
    }

    const isFirstHourOfLesson = (instructorId, hour) => {
        return lessons.some(lesson => {
            if (lesson.instructorId !== instructorId) return false
            if (!lesson.startTime) return false
            return parseInt(lesson.startTime.split(':')[0]) === hour
        })
    }

    // Pending panel: μαθήματα με ώρα αλλά ΧΩΡΙΣ εκπαιδευτή
    const pendingLessons = lessons.filter(l =>
        !l.instructorId && l.startTime && l.status !== 'cancelled'
    )

    const levelLabel = (lvl) => lvl === 'beginner' ? 'Αρχάριος' : lvl === 'intermediate' ? 'Μεσαίο' : 'Προχωρημένο'
    const statusLabel = (st) => st === 'confirmed' ? 'Επιβεβαιωμένο' : st === 'pending' ? 'Εκκρεμεί' : 'Ακυρωμένο'

    // ---- Drag & Drop ----
    const handleDragStart = (e, lesson, source) => {
        e.dataTransfer.setData('lessonId', lesson.id)
        e.dataTransfer.setData('source', source)
        e.dataTransfer.setData('startHour', lesson.startTime ? lesson.startTime.split(':')[0] : '')
        setMoveError('')
    }

    const handleDropOnGrid = async (e, instructorId, hour) => {
        e.preventDefault()
        setDragOver(null)
        const lessonId = e.dataTransfer.getData('lessonId')
        const source = e.dataTransfer.getData('source')
        const lockedHour = e.dataTransfer.getData('startHour')
        if (!lessonId) return

        // Από panel: η ώρα είναι κλειδωμένη — μόνο στη στήλη της
        if (source === 'panel') {
            if (lockedHour !== '' && parseInt(lockedHour) !== hour) {
                setMoveError(`Αυτό το μάθημα είναι κλειδωμένο στις ${lockedHour.padStart(2, '0')}:00 — μπορείς να το αφήσεις μόνο σε εκείνη την ώρα.`)
                setTimeout(() => setMoveError(''), 4000)
                return
            }
        }

        const newStartTime = `${hour.toString().padStart(2, '0')}:00`
        try {
            await moveLesson(lessonId, { instructorId, startTime: newStartTime })
            fetchData()
            if (onLessonMoved) onLessonMoved()
        } catch (err) {
            setMoveError(err.response?.data?.error || 'Δεν ήταν δυνατή η μετακίνηση')
            setTimeout(() => setMoveError(''), 4000)
        }
    }

    const handleDropOnPanel = async (e) => {
        e.preventDefault()
        setPanelDragOver(false)
        const lessonId = e.dataTransfer.getData('lessonId')
        const source = e.dataTransfer.getData('source')
        if (!lessonId || source !== 'grid') return

        try {
            await unassignInstructor(lessonId)
            fetchData()
            if (onLessonMoved) onLessonMoved()
        } catch (err) {
            setMoveError(err.response?.data?.error || 'Δεν ήταν δυνατή η αφαίρεση')
            setTimeout(() => setMoveError(''), 4000)
        }
    }

    return (
        <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>📅 Πρόγραμμα Ημέρας</h2>
                <input type="date" value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--snow)', color: 'var(--text-primary)' }} />
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                💡 Σύρε μάθημα σε εκπαιδευτή/ώρα για μετακίνηση. Σύρε από το πλαίσιο «Εκκρεμή» στο grid για ανάθεση εκπαιδευτή — ή αντίστροφα για αφαίρεση.
            </p>

            {moveError && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {moveError}</div>
            )}

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                    { status: 'confirmed', label: 'Επιβεβαιωμένο' },
                    { status: 'pending', label: 'Εκκρεμεί' },
                    { status: 'cancelled', label: 'Ακυρωμένο' },
                    { status: 'free', label: 'Ελεύθερο' },
                ].map(({ status, label }) => {
                    const color = getColor(status)
                    return (
                        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: 16, height: 16, background: color.bg, border: `2px solid ${color.border}`, borderRadius: 3 }} />
                            <span style={{ fontSize: '0.8rem' }}>{label}</span>
                        </div>
                    )
                })}
            </div>

            {loading ? (
                <p>Φόρτωση...</p>
            ) : (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {/* PENDING PANEL */}
                    <div
                        onDragOver={e => { e.preventDefault(); setPanelDragOver(true) }}
                        onDragLeave={() => setPanelDragOver(false)}
                        onDrop={handleDropOnPanel}
                        style={{
                            width: 240, flexShrink: 0,
                            background: panelDragOver ? '#fef3c7' : 'var(--ice)',
                            border: `2px dashed ${panelDragOver ? '#f59e0b' : 'var(--border)'}`,
                            borderRadius: 10, padding: '0.75rem', minHeight: 200,
                            transition: 'background 0.15s, border-color 0.15s'
                        }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#856404' }}>
                            📋 Εκκρεμή ({pendingLessons.length})
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                            Μαθήματα με ώρα, χωρίς εκπαιδευτή
                        </div>

                        {pendingLessons.length === 0 ? (
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 20 }}>
                                Κανένα εκκρεμές μάθημα 🎉
                            </p>
                        ) : (
                            pendingLessons.map(lesson => {
                                const activeBookings = lesson.bookings?.filter(b => b.status !== 'cancelled') || []
                                return (
                                    <div key={lesson.id}
                                        draggable
                                        onDragStart={e => handleDragStart(e, lesson, 'panel')}
                                        onClick={() => setLessonModal(lesson)}
                                        style={{
                                            background: 'var(--snow)',
                                            border: '2px solid #ffc107',
                                            borderRadius: 8,
                                            padding: '0.6rem',
                                            marginBottom: 8,
                                            cursor: 'grab',
                                            fontSize: 12
                                        }}>
                                        <div style={{ fontWeight: 600, marginBottom: 2 }}>
                                            {lesson.sport === 'ski' ? '⛷️' : '🏂'} {lesson.startTime} — {lesson.duration} ώρ.
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                                            {lesson.type === 'open_group'
                                                ? `👥 Ομαδικό (${activeBookings.length} άτομα)`
                                                : `👤 ${activeBookings[0]?.customerName || 'Ατομικό'}`}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                                            📊 {levelLabel(lesson.level)}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* GRID */}
                    <div style={{ overflowX: 'auto', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '0.75rem', background: 'var(--navy)', color: '#fff', textAlign: 'left', borderRadius: '8px 0 0 0', minWidth: 140 }}>
                                        Εκπαιδευτής
                                    </th>
                                    {HOURS.map(h => (
                                        <th key={h} style={{ padding: '0.75rem', background: 'var(--navy)', color: '#fff', textAlign: 'center', minWidth: 80 }}>
                                            {h.toString().padStart(2, '0')}:00
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {instructors.length === 0 ? (
                                    <tr>
                                        <td colSpan={HOURS.length + 1} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            Δεν υπάρχουν εκπαιδευτές
                                        </td>
                                    </tr>
                                ) : (
                                    instructors.map((instructor, idx) => (
                                        <tr key={instructor.id} style={{ background: idx % 2 === 0 ? 'var(--snow)' : 'var(--ice)' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 600, borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                                {instructor.name}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                                                    {instructor.specialty.join(', ')}
                                                </div>
                                            </td>
                                            {HOURS.map(hour => {
                                                const lesson = getLessonForSlot(instructor.id, hour)
                                                const isFirst = isFirstHourOfLesson(instructor.id, hour)
                                                const color = lesson ? getColor(lesson.status) : getColor('free')
                                                const isDragTarget = dragOver && dragOver.instructorId === instructor.id && dragOver.hour === hour

                                                return (
                                                    <td key={hour}
                                                        onDragOver={e => { e.preventDefault(); if (!lesson) setDragOver({ instructorId: instructor.id, hour }) }}
                                                        onDragLeave={() => setDragOver(null)}
                                                        onDrop={e => handleDropOnGrid(e, instructor.id, hour)}
                                                        style={{
                                                            padding: '0.5rem',
                                                            borderBottom: '1px solid var(--border)',
                                                            borderLeft: '1px solid var(--border)',
                                                            background: isDragTarget ? '#e0f2fe' : 'transparent'
                                                        }}>
                                                        <div
                                                            draggable={!!(lesson && isFirst)}
                                                            onDragStart={e => lesson && handleDragStart(e, lesson, 'grid')}
                                                            onClick={() => lesson && setLessonModal(lesson)}
                                                            style={{
                                                                background: color.bg,
                                                                border: `2px solid ${color.border}`,
                                                                borderRadius: 6,
                                                                padding: '0.4rem',
                                                                minHeight: 50,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                fontSize: '0.75rem',
                                                                color: color.text,
                                                                textAlign: 'center',
                                                                cursor: lesson && isFirst ? 'grab' : lesson ? 'pointer' : 'default'
                                                            }}>
                                                            {lesson && isFirst ? (
                                                                <>
                                                                    <div style={{ fontWeight: 600 }}>
                                                                        {lesson.sport === 'ski' ? '⛷️' : '🏂'}
                                                                    </div>
                                                                    <div>{lesson.bookings?.[0]?.customerName?.split(' ')[0] || (lesson.type === 'open_group' ? '👥' : '')}</div>
                                                                </>
                                                            ) : lesson ? (
                                                                <div>│</div>
                                                            ) : (
                                                                <div style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>—</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal πληροφοριών μαθήματος */}
            {lessonModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
                    onClick={() => setLessonModal(null)}>
                    <div className="card" style={{ width: '100%', maxWidth: 460 }}
                        onClick={e => e.stopPropagation()}>
                        <div className="card-header" style={{ background: 'var(--navy)', color: 'white' }}>
                            <span className="card-title" style={{ color: 'white' }}>
                                {lessonModal.sport === 'ski' ? '⛷️' : '🏂'} Λεπτομέρειες Μαθήματος
                            </span>
                            <button onClick={() => setLessonModal(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18 }}>✕</button>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'grid', gap: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Τύπος</span>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                                        {lessonModal.type === 'open_group' ? '👥 Ανοιχτό Ομαδικό' : lessonModal.persons > 1 ? '👥 Κλειστό Ομαδικό' : '👤 Ατομικό'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Ώρα</span>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{lessonModal.startTime || 'Μη ορισμένη'} {lessonModal.startTime && `— ${lessonModal.duration} ώρ.`}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Επίπεδο</span>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{levelLabel(lessonModal.level)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Τιμή</span>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{lessonModal.price}€</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Κατάσταση</span>
                                    <span className={`badge badge-${lessonModal.status}`}>{statusLabel(lessonModal.status)}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', borderTop: '0.5px solid var(--border)', paddingTop: '1rem' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                                    👥 {lessonModal.type === 'open_group' ? 'Συμμετέχοντες' : 'Πελάτης'}
                                </div>
                                {lessonModal.bookings?.filter(b => b.status !== 'cancelled').length === 0 ? (
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Καμία κράτηση ακόμα.</p>
                                ) : (
                                    lessonModal.bookings?.filter(b => b.status !== 'cancelled').map(b => (
                                        <div key={b.id} style={{ fontSize: 12, padding: '4px 0', color: 'var(--text-secondary)' }}>
                                            👤 {b.customerName} {b.customerPhone && `• 📞 ${b.customerPhone}`}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ScheduleGrid
