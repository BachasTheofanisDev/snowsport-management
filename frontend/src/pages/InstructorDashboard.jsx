import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getInstructorLessons } from '../api'

function InstructorDashboard() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [lessons, setLessons] = useState([])

  useEffect(() => { fetchLessons() }, [])

  const fetchLessons = async () => {
    try {
      const res = await getInstructorLessons()
      setLessons(res.data)
    } catch (err) { console.error(err) }
  }

  const handleLogout = () => { logoutUser(); navigate('/') }

  const confirmed = lessons.filter(l => l.status === 'confirmed')
  const pending = lessons.filter(l => l.status === 'pending')

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
            <div className="stat-label">Εκπαιδευτής</div>
            <div className="stat-value" style={{ fontSize: 16, marginTop: 4 }}>{user?.name}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Σύνολο Μαθημάτων</div>
            <div className="stat-value">{lessons.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Επιβεβαιωμένα</div>
            <div className="stat-value green">{confirmed.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Εκκρεμή</div>
            <div className="stat-value amber">{pending.length}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Το Πρόγραμμά μου</span>
          </div>
          <div className="card-body">
            {lessons.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν μαθήματα ακόμα.</p>
            ) : (
              lessons.map(lesson => (
                <div key={lesson.id} className="lesson-item">
                  <div style={{ flex: 1 }}>
                    <div className="lesson-sport">
                      {lesson.sport === 'ski' ? '⛷️' : '🏂'} {lesson.startTime} — {lesson.duration} ώρ. — {lesson.price}€
                      <span className={`badge ${lesson.type === 'group' ? 'badge-pending' : 'badge-confirmed'}`} style={{ marginLeft: 8 }}>
                        {lesson.type === 'group' ? `👥 Ομαδικό (${lesson.persons} άτομα)` : '👤 Ατομικό'}
                      </span>
                    </div>
                    <div className="lesson-meta">
                      📅 {new Date(lesson.date).toLocaleDateString('el-GR')} &nbsp;
                      📊 {lesson.level === 'beginner' ? 'Αρχάριος' : lesson.level === 'intermediate' ? 'Μεσαίο' : 'Προχωρημένο'}
                    </div>
                    {lesson.bookings?.map(b => (
                      <div key={b.id} style={{ marginTop: 8, padding: '6px 10px', background: 'var(--ice)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-secondary)' }}>
                        👤 {b.customerName} — 📞 {b.customerPhone}
                      </div>
                    ))}
                    <div style={{ marginTop: 8 }}>
                      <span className={`badge badge-${lesson.status}`}>
                        {lesson.status === 'confirmed' ? 'Επιβεβαιωμένο' : lesson.status === 'pending' ? 'Εκκρεμεί' : 'Ακυρωμένο'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default InstructorDashboard