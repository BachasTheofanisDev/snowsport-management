import { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  getInstructors, createInstructor, getLessons, createLesson,
  deleteLesson, updateLesson, cancelBooking, createOpenGroupLesson,
  updateSchoolInfo, uploadSchoolGallery, deleteSchoolGalleryImage,
  setSchoolMainImage, lockOpenGroup
} from '../api'
import ScheduleGrid from '../components/ScheduleGrid'
import StatsPanel from '../components/StatsPanel'
import DashboardShell from '../components/ui/DashboardShell'
import ConfirmModal from '../components/ui/ConfirmModal'
import OverviewTab from '../components/school/OverviewTab'
import InstructorsTab from '../components/school/InstructorsTab'
import LessonsTab from '../components/school/LessonsTab'
import OpenGroupsTab from '../components/school/OpenGroupsTab'
import LockModal from '../components/school/LockModal'
import InfoTab from '../components/school/InfoTab'
import GalleryTab from '../components/school/GalleryTab'
import DateFilterBar from '../components/school/DateFilterBar'
import '../components/ui/dashboard-layout.css'

function SchoolDashboard() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [instructors, setInstructors] = useState([])
  const [lessons, setLessons] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [showInstructorForm, setShowInstructorForm] = useState(false)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])

  const [schoolImage, setSchoolImage] = useState(user?.image || null)
  const [uploading, setUploading] = useState(false)
  const [gallery, setGallery] = useState(user?.gallery || [])
  const galleryInputRef = useRef(null)

  const [info, setInfo] = useState({ description: user?.description || '' })
  const [infoSaved, setInfoSaved] = useState(false)

  const [instructorForm, setInstructorForm] = useState({ name: '', email: '', password: '', phone: '', specialty: [] })
  const [lessonForm, setLessonForm] = useState({
    date: '', startTime: '09:00', duration: 1, sport: 'ski',
    level: 'beginner', instructorId: '', customerName: '', customerPhone: '', persons: 1
  })
  const [showOpenGroupForm, setShowOpenGroupForm] = useState(false)
  const [openGroupForm, setOpenGroupForm] = useState({ date: '', duration: 1, sport: 'ski', level: 'beginner' })

  const [lockModal, setLockModal] = useState(null)
  const [lockForm, setLockForm] = useState({ startTime: '', instructorId: '' })
  const [lockError, setLockError] = useState('')

  useEffect(() => { fetchInstructors(); fetchLessons() }, [])

  const fetchInstructors = async () => {
    try { const res = await getInstructors(); setInstructors(res.data) } catch (err) { console.error(err) }
  }
  const fetchLessons = async () => {
    try { const res = await getLessons(); setLessons(res.data) } catch (err) { console.error(err) }
  }

  // ── Instructors ──
  const handleInstructorSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      await createInstructor(instructorForm)
      setInstructorForm({ name: '', email: '', password: '', phone: '', specialty: [] })
      setShowInstructorForm(false); fetchInstructors()
    } catch (err) { setError(err.response?.data?.error || 'Κάτι πήγε στραβά') } finally { setLoading(false) }
  }
  const toggleSpecialty = (sport) => setInstructorForm(prev => ({
    ...prev,
    specialty: prev.specialty.includes(sport) ? prev.specialty.filter(s => s !== sport) : [...prev.specialty, sport]
  }))

  // ── Lessons ──
  const handleLessonSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const payload = { ...lessonForm, duration: parseInt(lessonForm.duration), price: parseFloat(lessonForm.price) }
      if (editingLesson) await updateLesson(editingLesson, payload)
      else await createLesson(payload)
      setLessonForm({ date: '', startTime: '09:00', duration: 1, sport: 'ski', level: 'beginner', price: '', instructorId: '', customerName: '', customerPhone: '', persons: 1 })
      setShowLessonForm(false); setEditingLesson(null); fetchLessons()
    } catch (err) { setError(err.response?.data?.error || 'Κάτι πήγε στραβά') } finally { setLoading(false) }
  }
  const handleDeleteLesson = async (id) => {
    if (!window.confirm('Σίγουρα θέλεις να διαγράψεις αυτό το μάθημα;')) return
    try { await deleteLesson(id); fetchLessons() } catch (err) { alert(err.response?.data?.error || 'Κάτι πήγε στραβά') }
  }
  const handleEditClick = (lesson) => {
    setEditingLesson(lesson.id)
    setLessonForm({
      date: new Date(lesson.date).toISOString().split('T')[0],
      startTime: lesson.startTime, duration: lesson.duration, sport: lesson.sport,
      level: lesson.level, price: lesson.price, instructorId: lesson.instructorId,
      customerName: lesson.bookings[0]?.customerName || '', customerPhone: lesson.bookings[0]?.customerPhone || ''
    })
    setShowLessonForm(true); setActiveTab('lessons')
  }
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Σίγουρα θέλεις να ακυρώσεις αυτή την κράτηση;')) return
    try { await cancelBooking(bookingId); fetchLessons() } catch (err) { alert(err.response?.data?.error || 'Κάτι πήγε στραβά') }
  }

  // ── Open groups ──
  const handleOpenGroupSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      await createOpenGroupLesson(openGroupForm)
      setOpenGroupForm({ date: '', duration: 1, sport: 'ski', level: 'beginner' })
      setShowOpenGroupForm(false); fetchLessons()
    } catch (err) { setError(err.response?.data?.error || 'Κάτι πήγε στραβά') } finally { setLoading(false) }
  }
  const openLockModal = (lesson) => {
    const activeBookings = lesson.bookings?.filter(b => b.status !== 'cancelled') || []
    const hourVotes = {}
    activeBookings.forEach(b => { (b.preferredHours || []).forEach(h => { hourVotes[h] = (hourVotes[h] || 0) + 1 }) })
    const maxStart = 16 - lesson.duration
    let bestHour = ''; let bestVotes = -1
    for (let h = 9; h <= maxStart; h++) {
      const votes = hourVotes[h] || 0
      if (votes > bestVotes) { bestVotes = votes; bestHour = `${h.toString().padStart(2, '0')}:00` }
    }
    setLockForm({ startTime: bestHour, instructorId: '' }); setLockError(''); setLockModal(lesson)
  }
  const handleLockSubmit = async () => {
    if (!lockForm.startTime || !lockForm.instructorId) { setLockError('Επίλεξε ώρα και εκπαιδευτή'); return }
    try { await lockOpenGroup(lockModal.id, lockForm); setLockModal(null); fetchLessons() }
    catch (err) { setLockError(err.response?.data?.error || 'Κάτι πήγε στραβά') }
  }

  // ── Info + gallery ──
  const handleInfoSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setInfoSaved(false)
    try { await updateSchoolInfo(info); setInfoSaved(true) }
    catch (err) { alert(err.response?.data?.error || 'Κάτι πήγε στραβά') } finally { setLoading(false) }
  }
  const handleGalleryUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) formData.append('images', files[i])
      const res = await uploadSchoolGallery(formData); setGallery(res.data.gallery)
    } catch (err) { alert(err.response?.data?.error || 'Σφάλμα στο ανέβασμα') } finally { setUploading(false) }
  }
  const handleDeleteGalleryImage = async (imagePath) => {
    if (!window.confirm('Διαγραφή αυτής της φωτογραφίας;')) return
    try { const res = await deleteSchoolGalleryImage(imagePath); setGallery(res.data.gallery) }
    catch (err) { alert(err.response?.data?.error || 'Κάτι πήγε στραβά') }
  }
  const handleSetMain = async (imagePath) => {
    try { const res = await setSchoolMainImage(imagePath); setSchoolImage(res.data.image) }
    catch (err) { alert(err.response?.data?.error || 'Κάτι πήγε στραβά') }
  }
  const handleLogout = () => { logoutUser(); navigate('/') }

  // ── Derived data ──
  const isSameDay = (d, f) => new Date(d).toISOString().split('T')[0] === f
  const individualLessons = lessons.filter(l => l.type !== 'open_group' && isSameDay(l.date, filterDate))
  const groupLessons = lessons.filter(l => l.type === 'open_group' && isSameDay(l.date, filterDate))

  const totalAllReviews = instructors.reduce((s, i) => s + (i.totalReviews || 0), 0)
  const schoolAvgRating = totalAllReviews > 0
    ? Math.round((instructors.reduce((s, i) => s + (i.avgRating || 0) * (i.totalReviews || 0), 0) / totalAllReviews) * 10) / 10
    : 0

  const metrics = useMemo(() => {
    const today = new Date().toDateString()
    const isToday = (d) => new Date(d).toDateString() === today
    const individual = lessons.filter(l => l.type !== 'open_group')
    const group = lessons.filter(l => l.type === 'open_group')
    const todaysLessons = lessons.filter(l => isToday(l.date))
    const revenue = lessons.filter(l => l.status !== 'cancelled').reduce((sum, l) => sum + (Number(l.price) || 0), 0)
    return {
      individual: individual.length, group: group.length,
      pending: lessons.filter(l => l.status === 'pending').length,
      todayCount: todaysLessons.length,
      todaysLessons: todaysLessons.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
      revenue, instructorCount: instructors.length,
    }
  }, [lessons, instructors])

  const NAV = [
    { id: 'overview', label: 'Επισκόπηση', dot: '#7eb8f7' },
    { id: 'lessons', label: 'Ατομικά', dot: '#7eb8f7', badge: individualLessons.length },
    { id: 'open_group', label: 'Ομαδικά', dot: '#17a2ad', badge: groupLessons.length },
    { id: 'instructors', label: 'Εκπαιδευτές', dot: '#94a3b8', badge: instructors.length },
    { id: 'schedule', label: 'Πρόγραμμα', dot: '#3B6D11' },
    { id: 'stats', label: 'Στατιστικά', dot: '#94a3b8' },
    { id: 'info', label: 'Πληροφορίες', dot: '#94a3b8' },
    { id: 'photos', label: 'Φωτογραφίες', dot: '#94a3b8' },
  ]
  const TITLES = {
    overview: 'Επισκόπηση', lessons: 'Ατομικά μαθήματα', open_group: 'Ομαδικά μαθήματα',
    instructors: 'Εκπαιδευτές', schedule: 'Πρόγραμμα', stats: 'Στατιστικά & έσοδα',
    info: 'Πληροφορίες σχολής', photos: 'Φωτογραφίες'
  }

  const sidebarProps = {
    brand: user?.name || 'Σχολή', brandSub: 'SNOWSPORT · SCHOOL', logo: '🏔',
    navItems: NAV, activeTab, onTabChange: (id) => { setActiveTab(id); setError('') }, user, onLogout: handleLogout
  }

  // Καρτέλες που φιλτράρονται με ημερομηνία → δείχνουμε κοινό ημερολόγιο στο header
  const dateTabs = ['lessons', 'open_group', 'schedule']
  const showNewLesson = activeTab === 'overview' || activeTab === 'lessons'

  const headerAction = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {dateTabs.includes(activeTab) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input className="form-input" type="date" value={filterDate}
            onChange={e => setFilterDate(e.target.value)} style={{ width: 'auto' }} />
          <button className="btn btn-sm" style={{ background: 'var(--ice)', color: 'var(--text-secondary)' }}
            onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}>Σήμερα</button>
        </div>
      )}
      {showNewLesson && (
        <button className="btn btn-primary" onClick={() => { setActiveTab('lessons'); setShowLessonForm(true); setEditingLesson(null) }}>
          + Νέο μάθημα
        </button>
      )}
    </div>
  )

  return (
    <DashboardShell sidebarProps={sidebarProps} title={TITLES[activeTab]} headerAction={headerAction}>
      {error && <div className="alert alert-error">{error}</div>}

      {activeTab === 'overview' && (
        <OverviewTab metrics={metrics} schoolAvgRating={schoolAvgRating} totalAllReviews={totalAllReviews}
          instructors={instructors} onGoToSchedule={() => setActiveTab('schedule')} />
      )}

      {activeTab === 'instructors' && (
        <InstructorsTab instructors={instructors} showForm={showInstructorForm} onToggleForm={() => setShowInstructorForm(!showInstructorForm)}
          form={instructorForm} onFormChange={setInstructorForm} onToggleSpecialty={toggleSpecialty} onSubmit={handleInstructorSubmit} loading={loading} />
      )}

      {activeTab === 'lessons' && (
        <LessonsTab lessons={individualLessons} instructors={instructors}
          showForm={showLessonForm} onToggleForm={() => { setShowLessonForm(!showLessonForm); setEditingLesson(null) }}
          form={lessonForm} onFormChange={setLessonForm} onSubmit={handleLessonSubmit} editing={editingLesson}
          loading={loading} onEdit={handleEditClick} onDelete={handleDeleteLesson} onCancelBooking={handleCancelBooking} />
      )}

      {activeTab === 'open_group' && (
        <OpenGroupsTab groupLessons={groupLessons}
          showForm={showOpenGroupForm} onToggleForm={() => setShowOpenGroupForm(!showOpenGroupForm)}
          form={openGroupForm} onFormChange={setOpenGroupForm} onSubmit={handleOpenGroupSubmit} loading={loading} onLock={openLockModal} />
      )}

      {activeTab === 'info' && (
        <InfoTab info={info} onChange={setInfo} onSubmit={handleInfoSubmit} loading={loading} />
      )}

      {activeTab === 'photos' && (
        <GalleryTab gallery={gallery} mainImage={schoolImage} uploading={uploading} inputRef={galleryInputRef}
          onUpload={handleGalleryUpload} onSetMain={handleSetMain} onDelete={handleDeleteGalleryImage} />
      )}

      {activeTab === 'schedule' && <ScheduleGrid schoolId={user?.id} token={localStorage.getItem('token')} date={filterDate} onDateChange={setFilterDate} onLessonMoved={fetchLessons} />}
      {activeTab === 'stats' && <StatsPanel />}

      <LockModal lesson={lockModal} form={lockForm} onFormChange={setLockForm} error={lockError}
        instructors={instructors} onSubmit={handleLockSubmit} onClose={() => setLockModal(null)} />

      <ConfirmModal open={infoSaved} onClose={() => setInfoSaved(false)} title="Αποθηκεύτηκε!" message="Οι πληροφορίες ενημερώθηκαν επιτυχώς." />
    </DashboardShell>
  )
}

export default SchoolDashboard
