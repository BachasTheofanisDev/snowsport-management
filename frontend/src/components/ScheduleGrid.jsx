import { useState, useEffect } from 'react'
import axios from 'axios'

const HOURS = [9, 10, 11, 12, 13, 14, 15]

const getColor = (status) => {
    switch (status) {
        case 'confirmed': return { bg: '#d4edda', border: '#28a745', text: '#155724' }
        case 'pending': return { bg: '#fff3cd', border: '#ffc107', text: '#856404' }
        case 'cancelled': return { bg: '#f8d7da', border: '#dc3545', text: '#721c24' }
        default: return { bg: '#f8f9fa', border: '#dee2e6', text: '#6c757d' }
    }
}

function ScheduleGrid({ schoolId, token }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [instructors, setInstructors] = useState([])
    const [lessons, setLessons] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (date && schoolId) {
            fetchData()
        }
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

    // Βρες το μάθημα για συγκεκριμένο εκπαιδευτή και ώρα
    const getLessonForSlot = (instructorId, hour) => {
        return lessons.find(lesson => {
            if (lesson.instructorId !== instructorId) return false
            const startHour = parseInt(lesson.startTime.split(':')[0])
            const endHour = startHour + lesson.duration
            return hour >= startHour && hour < endHour
        })
    }

    const isFirstHourOfLesson = (instructorId, hour) => {
        return lessons.some(lesson => {
            if (lesson.instructorId !== instructorId) return false
            return parseInt(lesson.startTime.split(':')[0]) === hour
        })
    }

    return (
        <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>📅 Πρόγραμμα Ημέρας</h2>
                <input type="date" value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ddd' }} />
            </div>

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
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '0.75rem', background: '#1a1a2e', color: 'white', textAlign: 'left', borderRadius: '8px 0 0 0', minWidth: 140 }}>
                                    Εκπαιδευτής
                                </th>
                                {HOURS.map(h => (
                                    <th key={h} style={{ padding: '0.75rem', background: '#1a1a2e', color: 'white', textAlign: 'center', minWidth: 80 }}>
                                        {h.toString().padStart(2, '0')}:00
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {instructors.length === 0 ? (
                                <tr>
                                    <td colSpan={HOURS.length + 1} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                                        Δεν υπάρχουν εκπαιδευτές
                                    </td>
                                </tr>
                            ) : (
                                instructors.map((instructor, idx) => (
                                    <tr key={instructor.id} style={{ background: idx % 2 === 0 ? 'white' : '#f8f9fa' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 600, borderBottom: '1px solid #dee2e6' }}>
                                            {instructor.name}
                                            <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 400 }}>
                                                {instructor.specialty.join(', ')}
                                            </div>
                                        </td>
                                        {HOURS.map(hour => {
                                            const lesson = getLessonForSlot(instructor.id, hour)
                                            const isFirst = isFirstHourOfLesson(instructor.id, hour)
                                            const color = lesson ? getColor(lesson.status) : getColor('free')

                                            return (
                                                <td key={hour} style={{
                                                    padding: '0.5rem',
                                                    borderBottom: '1px solid #dee2e6',
                                                    borderLeft: '1px solid #dee2e6',
                                                }}>
                                                    <div style={{
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
                                                        textAlign: 'center'
                                                    }}>
                                                        {lesson && isFirst ? (
                                                            <>
                                                                <div style={{ fontWeight: 600 }}>
                                                                    {lesson.sport === 'ski' ? '⛷️' : '🏂'}
                                                                </div>
                                                                <div>{lesson.bookings?.[0]?.customerName?.split(' ')[0]}</div>
                                                            </>
                                                        ) : lesson ? (
                                                            <div>│</div>
                                                        ) : (
                                                            <div style={{ color: '#ccc' }}>—</div>
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
            )}
        </div>
    )
}

export default ScheduleGrid