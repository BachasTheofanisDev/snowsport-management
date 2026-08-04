import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  getSchools, createSchool, toggleSchool, deleteSchool,
  updateResortInfo, uploadResortMap, uploadResortGallery,
  deleteResortGalleryImage, setResortMainImage
} from '../api'
import DashboardShell from '../components/ui/DashboardShell'
import KpiCard from '../components/ui/KpiCard'
import ConfirmModal from '../components/ui/ConfirmModal'
import SchoolsTab from '../components/resort/SchoolsTab'
import ResortInfoTab from '../components/resort/ResortInfoTab'
import PhotosMapTab from '../components/resort/PhotosMapTab'
import NewSchoolModal from '../components/resort/NewSchoolModal'
import '../components/ui/dashboard-layout.css'

function ResortDashboard() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [schools, setSchools] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [resortImage, setResortImage] = useState(user?.image || null)
  const [uploading, setUploading] = useState(false)
  const [gallery, setGallery] = useState(user?.gallery || [])
  const [mapImage, setMapImage] = useState(user?.mapImage || null)
  const galleryInputRef = useRef(null)
  const mapInputRef = useRef(null)

  const [info, setInfo] = useState({
    description: user?.description || '', baseAltitude: user?.baseAltitude || '',
    peakAltitude: user?.peakAltitude || '', liftsCount: user?.liftsCount || '',
    totalSlopeLength: user?.totalSlopeLength || '', slopesGreen: user?.slopesGreen || '',
    slopesBlue: user?.slopesBlue || '', slopesRed: user?.slopesRed || '',
    slopesBlack: user?.slopesBlack || '', location: user?.location || '',
    openingHours: user?.openingHours || '', phone: user?.phone || ''
  })
  const [infoSaved, setInfoSaved] = useState(false)

  useEffect(() => { fetchSchools() }, [])

  const fetchSchools = async () => {
    try { const res = await getSchools(); setSchools(res.data) } catch (err) { console.error(err) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      await createSchool(form)
      setForm({ name: '', email: '', password: '', phone: '' })
      setShowForm(false); fetchSchools()
    } catch (err) { setError(err.response?.data?.error || 'Κάτι πήγε στραβά') } finally { setLoading(false) }
  }

  const handleToggle = async (id) => {
    try { await toggleSchool(id); fetchSchools() } catch (err) { alert(err.response?.data?.error || 'Κάτι πήγε στραβά') }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Σίγουρα θέλεις να διαγράψεις τη σχολή "${name}"; Θα διαγραφούν και όλα τα δεδομένα της!`)) return
    try { await deleteSchool(id); fetchSchools() } catch (err) { alert(err.response?.data?.error || 'Κάτι πήγε στραβά') }
  }

  const handleGalleryUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) formData.append('images', files[i])
      const res = await uploadResortGallery(formData); setGallery(res.data.gallery)
    } catch (err) { alert(err.response?.data?.error || 'Σφάλμα στο ανέβασμα') } finally { setUploading(false) }
  }

  const handleMapUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await uploadResortMap(formData); setMapImage(res.data.mapImage)
    } catch (err) { alert(err.response?.data?.error || 'Σφάλμα στο ανέβασμα') } finally { setUploading(false) }
  }

  const handleDeleteGalleryImage = async (imagePath) => {
    if (!window.confirm('Διαγραφή αυτής της φωτογραφίας;')) return
    try { const res = await deleteResortGalleryImage(imagePath); setGallery(res.data.gallery) }
    catch (err) { alert(err.response?.data?.error || 'Κάτι πήγε στραβά') }
  }

  const handleSetMain = async (imagePath) => {
    try { const res = await setResortMainImage(imagePath); setResortImage(res.data.image) }
    catch (err) { alert(err.response?.data?.error || 'Κάτι πήγε στραβά') }
  }

  const handleInfoSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setInfoSaved(false)
    try { await updateResortInfo(info); setInfoSaved(true) }
    catch (err) { alert(err.response?.data?.error || 'Κάτι πήγε στραβά') } finally { setLoading(false) }
  }

  const handleLogout = () => { logoutUser(); navigate('/') }

  const metrics = useMemo(() => ({
    total: schools.length,
    active: schools.filter(s => s.isActive).length,
    inactive: schools.filter(s => !s.isActive).length,
  }), [schools])

  const NAV = [
    { id: 'overview', label: 'Επισκόπηση', dot: '#7eb8f7' },
    { id: 'schools', label: 'Σχολές', dot: '#17a2ad', badge: schools.length },
    { id: 'info', label: 'Πληροφορίες', dot: '#94a3b8' },
    { id: 'photos', label: 'Φωτογραφίες & Χάρτης', dot: '#94a3b8' },
  ]
  const TITLES = {
    overview: 'Επισκόπηση', schools: 'Σχολές Σκι',
    info: 'Πληροφορίες χιονοδρομικού', photos: 'Φωτογραφίες & Χάρτης'
  }

  const sidebarProps = {
    brand: user?.name || 'Χιονοδρομικό', brandSub: 'SNOWSPORT · RESORT', logo: '🏔',
    navItems: NAV, activeTab, onTabChange: (id) => { setActiveTab(id); setError('') }, user, onLogout: handleLogout
  }

  const headerAction = (activeTab === 'overview' || activeTab === 'schools')
    ? <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Νέα σχολή</button>
    : null

  return (
    <DashboardShell sidebarProps={sidebarProps} title={TITLES[activeTab]} headerAction={headerAction}>
      {activeTab === 'overview' && (
        <div className="dash-stack">
          <div className="dash-kpis">
            <KpiCard label="Σύνολο σχολών" value={metrics.total} sub="στο χιονοδρομικό" />
            <KpiCard label="Ενεργές σχολές" value={metrics.active} sub="δέχονται κρατήσεις" color="var(--confirmed-text)" />
            <KpiCard label="Ανενεργές" value={metrics.inactive} sub="σε παύση" color="var(--pending-text)" />
            <KpiCard label="Πίστες" value={(Number(info.slopesGreen || 0) + Number(info.slopesBlue || 0) + Number(info.slopesRed || 0) + Number(info.slopesBlack || 0)) || '—'} sub="συνολικά" color="#185FA5" />
          </div>
          <SchoolsTab schools={schools} onNew={() => setShowForm(true)} onToggle={handleToggle} onDelete={handleDelete} />
        </div>
      )}

      {activeTab === 'schools' && (
        <SchoolsTab schools={schools} onNew={() => setShowForm(true)} onToggle={handleToggle} onDelete={handleDelete} />
      )}

      {activeTab === 'info' && (
        <ResortInfoTab info={info} onChange={setInfo} onSubmit={handleInfoSubmit} loading={loading} />
      )}

      {activeTab === 'photos' && (
        <PhotosMapTab gallery={gallery} mainImage={resortImage} mapImage={mapImage} uploading={uploading}
          galleryInputRef={galleryInputRef} mapInputRef={mapInputRef}
          onGalleryUpload={handleGalleryUpload} onMapUpload={handleMapUpload}
          onSetMain={handleSetMain} onDeleteImage={handleDeleteGalleryImage} />
      )}

      <NewSchoolModal open={showForm} onClose={() => { setShowForm(false); setError('') }}
        form={form} onChange={setForm} onSubmit={handleSubmit} error={error} loading={loading} />

      <ConfirmModal open={infoSaved} onClose={() => setInfoSaved(false)} title="Αποθηκεύτηκε!" message="Οι πληροφορίες του χιονοδρομικού ενημερώθηκαν επιτυχώς." />
    </DashboardShell>
  )
}

export default ResortDashboard
