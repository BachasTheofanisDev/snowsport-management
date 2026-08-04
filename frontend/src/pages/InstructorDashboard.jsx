import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getInstructorLessons, getMyReviews, getMySchool, uploadInstructorImage, getInstructorStats, updateInstructorInfo } from '../api'

function InstructorDashboard() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [lessons, setLessons] = useState([])
  const [activeTab, setActiveTab] = useState('lessons')
  const [reviews, setReviews] = useState({ reviews: [], avgRating: 0, total: 0 })
  const [school, setSchool] = useState(null)
  const [instructorImage, setInstructorImage] = useState(user?.image || null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [stats, setStats] = useState(null)
  const [statsFrom, setStatsFrom] = useState(new Date().toISOString().split('T')[0])
  const [statsTo, setStatsTo] = useState(new Date().toISOString().split('T')[0])
  const [statsRange, setStatsRange] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [info, setInfo] = useState({ description: user?.description || '' })
  const [infoSaved, setInfoSaved] = useState(false)

  useEffect(() => {
    fetchLessons()
    fetchReviews()
    fetchSchool()
  }, [])

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

  const fetchSchool = async () => {
    try {
      const res = await getMySchool()
      setSchool(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const res = await getInstructorStats(statsFrom, statsRange ? statsTo : statsFrom)
      setStats(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleInfoSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateInstructorInfo(info)
      setInfoSaved(true)
    } catch (err) {
      alert(err.response?.data?.error || 'Κάτι πήγε στραβά')
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await uploadInstructorImage(formData)
      setInstructorImage(res.data.image)
    } catch (err) {
      alert(err.response?.data?.error || 'Σφάλμα στο ανέβασμα')
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = () => { logoutUser(); navigate('/') }

  // Banner = φωτογραφία σχολής (read-only)
  const bannerBackground = school?.image
    ? `linear-gradient(180deg, rgba(8,20,35,0.3) 0%, rgba(8,20,35,0.75) 100%), url(http://localhost:5000${school.image}) center 35%/cover`
    : 'linear-gradient(135deg, #0c2740 0%, #0284c7 100%)'

  // Avatar = δική του φωτογραφία
  const avatarImage = instructorImage ? `http://localhost:5000${instructorImage}` : null

  const isSameDay = (lessonDate, filter) => {
    const d = new Date(lessonDate).toISOString().split('T')[0]
    return d === filter
  }

  const dayLessons = lessons.filter(l => isSameDay(l.date, filterDate))
  const confirmed = dayLessons.filter(l => l.status === 'confirmed')
  const pending = dayLessons.filter(l => l.status === 'pending')

  return (
    <>
      <div className="hero-banner" style={{
        position: 'relative',
        height: 300,
        overflow: 'hidden',
        background: bannerBackground
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#fff' }}>
            🏔 SNOWSPORT <span style={{ fontWeight: 300 }}>MANAGEMENT</span>
          </div>
          <button onClick={handleLogout} style={{ padding: '10px 22px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Αποσύνδεση
          </button>
        </div>

        {/* Avatar + όνομα */}
        <div style={{ position: 'absolute', bottom: 40, left: 48, zIndex: 2, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              border: '4px solid rgba(255,255,255,0.9)',
              background: avatarImage ? `url(${avatarImage}) center/cover` : 'linear-gradient(135deg, #0284c7, #0c2740)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
              {!avatarImage && '👨‍🏫'}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 32, height: 32, borderRadius: '50%',
                background: '#0284c7', border: '2px solid #fff',
                color: '#fff', cursor: 'pointer', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Αλλαγή φωτογραφίας">
              {uploading ? '…' : '📷'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
          <div style={{ color: '#fff' }}>
            <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-1px', marginBottom: 4, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
              {user?.name}
            </h1>
            <p style={{ fontSize: 15, opacity: 0.95, textShadow: '0 1px 10px rgba(0,0,0,0.4)' }}>
              {school?.name || 'Εκπαιδευτής'}
            </p>
          </div>
        </div>
      </div>

      <div className="page">
        <div className="stats-grid" style={{ marginTop: -70, position: 'relative', zIndex: 3 }}>
          <div className="stat-card">
            <div className="stat-label">Εκπαιδευτής</div>
            <div className="stat-value" style={{ fontSize: 16, marginTop: 4 }}>{user?.name}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Μαθήματα Ημέρας</div>
            <div className="stat-value">{dayLessons.length}</div>
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
          {['lessons', 'reviews', 'finance', 'info'].map(tab => (
            <button key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab); if (tab === 'finance') fetchStats() }}>
              {tab === 'lessons' ? `📅 Πρόγραμμά μου (${lessons.length})`
                : tab === 'reviews' ? `⭐ Αξιολογήσεις (${reviews.total})`
                  : tab === 'finance' ? '💰 Οικονομικά'
                    : 'ℹ️ Το Προφίλ μου'}
            </button>
          ))}
        </div>

        {activeTab === 'lessons' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Το Πρόγραμμά μου</span>
            </div>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>📅 Ημερομηνία:</label>
              <input className="form-input" type="date" value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                style={{ width: 'auto' }} />
              <button className="btn btn-sm" style={{ background: 'var(--ice)', color: 'var(--text-secondary)' }}
                onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}>
                Σήμερα
              </button>
            </div>
            <div className="card-body">
              {dayLessons.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν μαθήματα για αυτή την ημερομηνία.</p>
              ) : (
                dayLessons.map(lesson => (
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
        {activeTab === 'finance' && (
          <div>
            {/* Φίλτρα */}
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-body">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{statsRange ? 'Από' : 'Ημερομηνία'}</label>
                    <input className="form-input" type="date" value={statsFrom}
                      onChange={e => setStatsFrom(e.target.value)} />
                  </div>

                  {statsRange && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Έως</label>
                      <input className="form-input" type="date" value={statsTo}
                        onChange={e => setStatsTo(e.target.value)} min={statsFrom} />
                    </div>
                  )}

                  <button className={`btn ${statsRange ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => setStatsRange(!statsRange)}>
                    {statsRange ? 'Μία ημερομηνία' : 'Εύρος ημερομηνιών'}
                  </button>

                  <button className="btn btn-primary" onClick={fetchStats} disabled={statsLoading}>
                    {statsLoading ? 'Φόρτωση...' : '🔍 Αναζήτηση'}
                  </button>
                </div>
              </div>
            </div>
            {stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Σύνολο Μαθημάτων</div>
                  <div className="stat-value">{stats.totalLessons}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Ατομικά</div>
                  <div className="stat-value blue">{stats.individualLessons}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Ομαδικά</div>
                  <div className="stat-value amber">{stats.groupLessons}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Συνολικά Έσοδα</div>
                  <div className="stat-value green">{stats.totalRevenue * 0.5}€</div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'info' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">ℹ️ Το Προφίλ μου</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleInfoSubmit}>
                <div className="form-group">
                  <label className="form-label">Περιγραφή / Βιογραφικό</label>
                  <textarea className="form-input" rows={5}
                    value={info.description}
                    onChange={e => setInfo({ ...info, description: e.target.value })}
                    placeholder="Πες λίγα λόγια για σένα: εμπειρία, πιστοποιήσεις, ειδικότητες, στυλ διδασκαλίας..." />
                </div>
                <button type="submit" className="btn btn-primary">
                  Αποθήκευση Προφίλ
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      {infoSaved && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <div className="card-body" style={{ padding: '2rem' }}>
              <div style={{ fontSize: 48, marginBottom: '1rem' }}>✅</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Αποθηκεύτηκε!</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Το προφίλ σου ενημερώθηκε επιτυχώς.
              </p>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setInfoSaved(false)}>
                Εντάξει
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default InstructorDashboard