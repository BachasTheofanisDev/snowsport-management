import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getInstructors, createInstructor, getLessons, createLesson, deleteLesson, updateLesson, cancelBooking, assignInstructor, createOpenGroupLesson } from '../api'
import ScheduleGrid from '../components/ScheduleGrid'
import StatsPanel from '../components/StatsPanel'

function SchoolDashboard() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [instructors, setInstructors] = useState([])
  const [lessons, setLessons] = useState([])
  const [activeTab, setActiveTab] = useState('lessons')
  const [showInstructorForm, setShowInstructorForm] = useState(false)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)

  const [instructorForm, setInstructorForm] = useState({
    name: '', email: '', password: '', phone: '', specialty: []
  })

  const [lessonForm, setLessonForm] = useState({
    date: '', startTime: '09:00', duration: 1, sport: 'ski',
    level: 'beginner', instructorId: '',
    customerName: '', customerPhone: '', persons: 1
  })

  const [showOpenGroupForm, setShowOpenGroupForm] = useState(false)
  const [openGroupForm, setOpenGroupForm] = useState({
    date: '', startTime: '09:00', duration: 1, sport: 'ski',
    level: 'beginner', instructorId: ''
  })

  useEffect(() => {
    fetchInstructors()
    fetchLessons()
  }, [])

  const fetchInstructors = async () => {
    try {
      const res = await getInstructors()
      setInstructors(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchLessons = async () => {
    try {
      const res = await getLessons()
      setLessons(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleInstructorSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createInstructor(instructorForm)
      setInstructorForm({ name: '', email: '', password: '', phone: '', specialty: [] })
      setShowInstructorForm(false)
      fetchInstructors()
    } catch (err) {
      setError(err.response?.data?.error || 'Κάτι πήγε στραβά')
    } finally {
      setLoading(false)
    }
  }

  const handleLessonSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (editingLesson) {
        await updateLesson(editingLesson, { ...lessonForm, duration: parseInt(lessonForm.duration), price: parseFloat(lessonForm.price) })
      } else {
        await createLesson({ ...lessonForm, duration: parseInt(lessonForm.duration), price: parseFloat(lessonForm.price) })
      }
      setLessonForm({ date: '', startTime: '09:00', duration: 1, sport: 'ski', level: 'beginner', price: '', instructorId: '', customerName: '', customerPhone: '' })
      setShowLessonForm(false)
      setEditingLesson(null)
      fetchLessons()
    } catch (err) {
      setError(err.response?.data?.error || 'Κάτι πήγε στραβά')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLesson = async (id) => {
    if (!window.confirm('Σίγουρα θέλεις να διαγράψεις αυτό το μάθημα;')) return
    try {
      await deleteLesson(id)
      fetchLessons()
    } catch (err) {
      alert(err.response?.data?.error || 'Κάτι πήγε στραβά')
    }
  }

  const handleEditClick = (lesson) => {
    setEditingLesson(lesson.id)
    setLessonForm({
      date: new Date(lesson.date).toISOString().split('T')[0],
      startTime: lesson.startTime,
      duration: lesson.duration,
      sport: lesson.sport,
      level: lesson.level,
      price: lesson.price,
      instructorId: lesson.instructorId,
      customerName: lesson.bookings[0]?.customerName || '',
      customerPhone: lesson.bookings[0]?.customerPhone || ''
    })
    setShowLessonForm(true)
  }

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Σίγουρα θέλεις να ακυρώσεις αυτή την κράτηση;')) return
    try {
      await cancelBooking(bookingId)
      fetchLessons()
    } catch (err) {
      alert(err.response?.data?.error || 'Κάτι πήγε στραβά')
    }
  }

  const handleLogout = () => {
    logoutUser()
    navigate('/')
  }

  const toggleSpecialty = (sport) => {
    setInstructorForm(prev => ({
      ...prev,
      specialty: prev.specialty.includes(sport)
        ? prev.specialty.filter(s => s !== sport)
        : [...prev.specialty, sport]
    }))
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

  const handleOpenGroupSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createOpenGroupLesson(openGroupForm)
      setOpenGroupForm({ date: '', startTime: '09:00', duration: 1, sport: 'ski', level: 'beginner', instructorId: '' })
      setShowOpenGroupForm(false)
      fetchLessons()
    } catch (err) {
      setError(err.response?.data?.error || 'Κάτι πήγε στραβά')
    } finally {
      setLoading(false)
    }
  }

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
            <div className="stat-label">Σχολή</div>
            <div className="stat-value" style={{ fontSize: 16, marginTop: 4 }}>{user?.name}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Εκπαιδευτές</div>
            <div className="stat-value blue">{instructors.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Σύνολο Μαθημάτων</div>
            <div className="stat-value">{lessons.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Επιβεβαιωμένα</div>
            <div className="stat-value green">{lessons.filter(l => l.status === 'confirmed').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Εκκρεμή</div>
            <div className="stat-value amber">{lessons.filter(l => l.status === 'pending').length}</div>
          </div>
        </div>

        <div className="tabs">
          {['lessons', 'open_group', 'instructors', 'schedule', 'stats'].map(tab => (
            <button key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab); setError('') }}>
              {tab === 'lessons' ? `📅 Ατομικά (${lessons.filter(l => l.type !== 'open_group').length})`
                : tab === 'open_group' ? `👥 Ομαδικά (${lessons.filter(l => l.type === 'open_group').length})`
                  : tab === 'instructors' ? `👨‍🏫 Εκπαιδευτές (${instructors.length})`
                    : tab === 'schedule' ? '📊 Πρόγραμμα'
                      : '📈 Στατιστικά'}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Instructors Tab */}
        {activeTab === 'instructors' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Εκπαιδευτές</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowInstructorForm(!showInstructorForm)}>
                {showInstructorForm ? 'Άκυρο' : '+ Νέος Εκπαιδευτής'}
              </button>
            </div>

            {showInstructorForm && (
              <div style={{ padding: '1.25rem', borderBottom: '0.5px solid var(--border)', background: 'var(--ice)' }}>
                <form onSubmit={handleInstructorSubmit}>
                  <div className="form-grid">
                    {[
                      { key: 'name', label: 'Όνομα', type: 'text' },
                      { key: 'email', label: 'Email', type: 'email' },
                      { key: 'password', label: 'Κωδικός', type: 'password' },
                      { key: 'phone', label: 'Τηλέφωνο', type: 'text' },
                    ].map(f => (
                      <div className="form-group" key={f.key}>
                        <label className="form-label">{f.label}</label>
                        <input className="form-input" type={f.type}
                          value={instructorForm[f.key]}
                          onChange={e => setInstructorForm({ ...instructorForm, [f.key]: e.target.value })}
                          required={f.key !== 'phone'} />
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ειδικότητα</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {['ski', 'snowboard'].map(sport => (
                        <label key={sport} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                          <input type="checkbox"
                            checked={instructorForm.specialty.includes(sport)}
                            onChange={() => toggleSpecialty(sport)} />
                          {sport === 'ski' ? '⛷️ Σκι' : '🏂 Snowboard'}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Δημιουργία...' : 'Δημιουργία Εκπαιδευτή'}
                  </button>
                </form>
              </div>
            )}

            <div className="card-body">
              {instructors.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν εκπαιδευτές ακόμα.</p>
              ) : (
                instructors.map(instructor => (
                  <div key={instructor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '0.5px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{instructor.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {instructor.email} {instructor.phone && `• ${instructor.phone}`}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {instructor.specialty.map(s => s === 'ski' ? '⛷️ Σκι' : '🏂 Snowboard').join(' • ')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Lessons Tab */}
        {activeTab === 'lessons' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Μαθήματα</span>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowLessonForm(!showLessonForm); setEditingLesson(null) }}>
                {showLessonForm ? 'Άκυρο' : '+ Νέο Μάθημα'}
              </button>
            </div>

            {showLessonForm && (
              <div style={{ padding: '1.25rem', borderBottom: '0.5px solid var(--border)', background: 'var(--ice)' }}>
                <form onSubmit={handleLessonSubmit}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Ημερομηνία</label>
                      <input className="form-input" type="date" value={lessonForm.date}
                        onChange={e => setLessonForm({ ...lessonForm, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Ώρα Έναρξης</label>
                      <select className="form-select" value={lessonForm.startTime}
                        onChange={e => setLessonForm({ ...lessonForm, startTime: e.target.value })}>
                        {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Διάρκεια (ώρες)</label>
                      <select className="form-select" value={lessonForm.duration}
                        onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })}>
                        {[1, 2, 3, 4, 5, 6, 7].map(d => (
                          <option key={d} value={d}>{d} ώρα{d > 1 ? 'ες' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Άθλημα</label>
                      <select className="form-select" value={lessonForm.sport}
                        onChange={e => setLessonForm({ ...lessonForm, sport: e.target.value })}>
                        <option value="ski">⛷️ Σκι</option>
                        <option value="snowboard">🏂 Snowboard</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Επίπεδο</label>
                      <select className="form-select" value={lessonForm.level}
                        onChange={e => setLessonForm({ ...lessonForm, level: e.target.value })}>
                        <option value="beginner">Αρχάριος</option>
                        <option value="intermediate">Μεσαίο</option>
                        <option value="advanced">Προχωρημένο</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Αριθμός Ατόμων</label>
                      <select className="form-select" value={lessonForm.persons}
                        onChange={e => setLessonForm({ ...lessonForm, persons: parseInt(e.target.value) })}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n} άτομο{n > 1 ? 'α' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Εκπαιδευτής (προαιρετικό)</label>
                      <select className="form-select" value={lessonForm.instructorId}
                        onChange={e => setLessonForm({ ...lessonForm, instructorId: e.target.value })}>
                        <option value="">-- Χωρίς εκπαιδευτή (Pending) --</option>
                        {instructors.map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Όνομα Πελάτη</label>
                      <input className="form-input" type="text" value={lessonForm.customerName}
                        onChange={e => setLessonForm({ ...lessonForm, customerName: e.target.value })} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Τηλέφωνο Πελάτη</label>
                      <input className="form-input" type="text" value={lessonForm.customerPhone}
                        onChange={e => setLessonForm({ ...lessonForm, customerPhone: e.target.value })} required />
                    </div>
                  </div>

                  <div style={{ background: 'white', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      Τύπος: {lessonForm.persons > 1 ? 'Ομαδικό' : 'Ατομικό'} • Άτομα: {lessonForm.persons}
                    </span>
                    <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>
                      Συνολικό κόστος: {calculatePrice(lessonForm.persons, lessonForm.duration)}€
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Αποθήκευση...' : editingLesson ? 'Αποθήκευση Αλλαγών' : 'Δημιουργία Μαθήματος'}
                  </button>
                </form>
              </div>
            )}

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
                        👨‍🏫 {lesson.instructor?.name || 'Χωρίς εκπαιδευτή'} &nbsp;
                        📊 {lesson.level === 'beginner' ? 'Αρχάριος' : lesson.level === 'intermediate' ? 'Μεσαίο' : 'Προχωρημένο'}
                      </div>
                      {lesson.bookings?.map(b => (
                        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, padding: '6px 10px', background: b.status === 'cancelled' ? 'var(--cancelled)' : 'var(--ice)', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: 12, color: b.status === 'cancelled' ? 'var(--cancelled-text)' : 'var(--text-secondary)' }}>
                            👤 {b.customerName} — 📞 {b.customerPhone}
                          </span>
                          {b.status !== 'cancelled' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleCancelBooking(b.id)}>
                              Ακύρωση
                            </button>
                          )}
                        </div>
                      ))}
                      <div style={{ marginTop: 8 }}>
                        <span className={`badge badge-${lesson.status}`}>
                          {lesson.status === 'confirmed' ? 'Επιβεβαιωμένο' : lesson.status === 'pending' ? 'Εκκρεμεί' : 'Ακυρωμένο'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleEditClick(lesson)}>
                        Επεξεργασία
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLesson(lesson.id)}>
                        Διαγραφή
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'open_group' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Ομαδικά Μαθήματα</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowOpenGroupForm(!showOpenGroupForm)}>
                {showOpenGroupForm ? 'Άκυρο' : '+ Νέο Ομαδικό'}
              </button>
            </div>

            {showOpenGroupForm && (
              <div style={{ padding: '1.25rem', borderBottom: '0.5px solid var(--border)', background: 'var(--ice)' }}>
                <form onSubmit={handleOpenGroupSubmit}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Ημερομηνία</label>
                      <input className="form-input" type="date" value={openGroupForm.date}
                        onChange={e => setOpenGroupForm({ ...openGroupForm, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Ώρα Έναρξης</label>
                      <select className="form-select" value={openGroupForm.startTime}
                        onChange={e => setOpenGroupForm({ ...openGroupForm, startTime: e.target.value })}>
                        {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Διάρκεια (ώρες)</label>
                      <select className="form-select" value={openGroupForm.duration}
                        onChange={e => setOpenGroupForm({ ...openGroupForm, duration: parseInt(e.target.value) })}>
                        {[1, 2, 3, 4, 5, 6, 7].map(d => (
                          <option key={d} value={d}>{d} ώρα{d > 1 ? 'ες' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Άθλημα</label>
                      <select className="form-select" value={openGroupForm.sport}
                        onChange={e => setOpenGroupForm({ ...openGroupForm, sport: e.target.value })}>
                        <option value="ski">⛷️ Σκι</option>
                        <option value="snowboard">🏂 Snowboard</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Επίπεδο</label>
                      <select className="form-select" value={openGroupForm.level}
                        onChange={e => setOpenGroupForm({ ...openGroupForm, level: e.target.value })}>
                        <option value="beginner">Αρχάριος</option>
                        <option value="intermediate">Μεσαίο</option>
                        <option value="advanced">Προχωρημένο</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Εκπαιδευτής (προαιρετικό)</label>
                      <select className="form-select" value={openGroupForm.instructorId}
                        onChange={e => setOpenGroupForm({ ...openGroupForm, instructorId: e.target.value })}>
                        <option value="">-- Χωρίς εκπαιδευτή --</option>
                        {instructors.map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ background: 'white', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Τιμή ανά άτομο: </span>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>{20 * openGroupForm.duration}€</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}> (20€/ώρα × {openGroupForm.duration} ώρες)</span>
                    <br />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Min: 4 άτομα • Max: 10 άτομα</span>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Δημιουργία...' : 'Δημιουργία Ομαδικού Μαθήματος'}
                  </button>
                </form>
              </div>
            )}

            <div className="card-body">
              {lessons.filter(l => l.type === 'open_group').length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν ομαδικά μαθήματα ακόμα.</p>
              ) : (
                lessons.filter(l => l.type === 'open_group').map(lesson => (
                  <div key={lesson.id} className="lesson-item">
                    <div style={{ flex: 1 }}>
                      <div className="lesson-sport">
                        {lesson.sport === 'ski' ? '⛷️' : '🏂'} {lesson.startTime} — {lesson.duration} ώρ.
                        <span className="badge badge-pending" style={{ marginLeft: 8 }}>
                          👥 {lesson.bookings?.length || 0}/{lesson.maxPersons} θέσεις
                        </span>
                      </div>
                      <div className="lesson-meta">
                        📅 {new Date(lesson.date).toLocaleDateString('el-GR')} &nbsp;
                        👨‍🏫 {lesson.instructor?.name} &nbsp;
                        📊 {lesson.level === 'beginner' ? 'Αρχάριος' : lesson.level === 'intermediate' ? 'Μεσαίο' : 'Προχωρημένο'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        💰 {20 * lesson.duration}€/άτομο • Min: {lesson.minPersons} άτομα
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <span className={`badge badge-${lesson.status}`}>
                          {lesson.status === 'confirmed' ? 'Ενεργό' : lesson.status === 'pending' ? 'Αναμένει κρατήσεις' : 'Ακυρωμένο'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <ScheduleGrid schoolId={user?.id} token={localStorage.getItem('token')} />
        )}

        {activeTab === 'stats' && <StatsPanel />}
      </div>
    </>
  )
}

export default SchoolDashboard