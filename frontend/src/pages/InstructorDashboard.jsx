import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getInstructorLessons, getMyReviews } from '../api'

function InstructorDashboard() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [lessons, setLessons] = useState([])
  const [activeTab, setActiveTab] = useState('lessons')
  const [reviews, setReviews] = useState({ reviews: [], avgRating: 0, total: 0 })

  useEffect(() => { fetchLessons() }, [])

  const fetchLessons = async () => {
    try {
      const res = await getInstructorLessons()
      setLessons(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchReviews = async () => {
    try {
      const res = await getMyReviews()
      setReviews(res.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchLessons(); fetchReviews() }, [])

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
            <div className="stat-label">Μέσος Όρος</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>
              {reviews.avgRating > 0 ? `${reviews.avgRating} ★` : '—'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Αξιολογήσεις</div>
            <div className="stat-value amber">{reviews.total}</div>
          </div>
        </div>

        <div className="tabs">
          {['lessons', 'reviews'].map(tab => (
            <button key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}>
              {tab === 'lessons' ? `📅 Πρόγραμμά μου (${lessons.length})` : `⭐ Αξιολογήσεις (${reviews.total})`}
            </button>
          ))}
        </div>

        {activeTab === 'lessons' && (
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
                      </div>
                      <div className="lesson-meta">
                        📅 {new Date(lesson.date).toLocaleDateString('el-GR')} &nbsp;
                        📊 {lesson.level === 'beginner' ? 'Αρχάριος' : lesson.level === 'intermediate' ? 'Μεσαίο' : 'Προχωρημένο'}
                      </div>
                      {lesson.bookings?.map(b => (
                        <div key={b.id} style={{ marginTop: 8, padding: '6px 10px', background: 'var(--ice)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-secondary)' }}>
                          👤 {b.customerName} — 📞 {b.customerPhone}
                          {b.review && (
                            <span style={{ marginLeft: 8, color: '#f59e0b' }}>
                              {'★'.repeat(b.review.rating)}
                            </span>
                          )}
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
        )}

        {activeTab === 'reviews' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">⭐ Οι Αξιολογήσεις μου</span>
              {reviews.avgRating > 0 && (
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                  {reviews.avgRating} / 5 ★
                </span>
              )}
            </div>
            <div className="card-body">
              {reviews.reviews.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν αξιολογήσεις ακόμα.</p>
              ) : (
                reviews.reviews.map(r => (
                  <div key={r.id} style={{ padding: '0.75rem 0', borderBottom: '0.5px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{r.customer.name}</span>
                      <span style={{ color: '#f59e0b', fontSize: 18 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>"{r.comment}"</p>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {new Date(r.createdAt).toLocaleDateString('el-GR')}
                    </p>
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

export default InstructorDashboard