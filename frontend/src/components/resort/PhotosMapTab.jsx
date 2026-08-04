import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'

/**
 * Tab Φωτογραφιών & Χάρτη: gallery (με κύρια/διαγραφή) + χάρτης πιστών.
 */
function PhotosMapTab({
  gallery, mainImage, mapImage, uploading,
  galleryInputRef, mapInputRef,
  onGalleryUpload, onMapUpload, onSetMain, onDeleteImage
}) {
  return (
    <div className="dash-stack">
      <Card title="📸 Φωτογραφίες"
        action={<>
          <button className="btn btn-primary btn-sm" onClick={() => galleryInputRef.current?.click()} disabled={uploading}>{uploading ? 'Ανέβασμα...' : '+ Προσθήκη Φωτογραφιών'}</button>
          <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={onGalleryUpload} style={{ display: 'none' }} />
        </>}>
        {gallery.length === 0
          ? <EmptyState>Δεν υπάρχουν φωτογραφίες ακόμα. Πρόσθεσε φωτογραφίες του χιονοδρομικού!</EmptyState>
          : (
            <div className="dash-gallery">
              {gallery.map((img, idx) => (
                <div key={idx} className={`dash-gallery-item ${mainImage === img ? 'main' : ''}`}>
                  <div style={{ height: 130, background: `url(http://localhost:5000${img}) center/cover` }} />
                  {mainImage === img && <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>ΚΥΡΙΑ</div>}
                  <div style={{ display: 'flex', gap: 4, padding: 8 }}>
                    <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', background: 'var(--ice)', color: 'var(--navy)', fontSize: 11 }} onClick={() => onSetMain(img)}>Κύρια</button>
                    <button className="btn btn-danger btn-sm" style={{ justifyContent: 'center', fontSize: 11 }} onClick={() => onDeleteImage(img)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </Card>

      <Card title="🗺 Χάρτης Πιστών"
        action={<>
          <button className="btn btn-primary btn-sm" onClick={() => mapInputRef.current?.click()} disabled={uploading}>{mapImage ? 'Αλλαγή Χάρτη' : '+ Προσθήκη Χάρτη'}</button>
          <input ref={mapInputRef} type="file" accept="image/*" onChange={onMapUpload} style={{ display: 'none' }} />
        </>}>
        {mapImage
          ? <img src={`http://localhost:5000${mapImage}`} alt="Χάρτης" style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)' }} />
          : <EmptyState>Δεν έχει ανέβει χάρτης ακόμα.</EmptyState>}
      </Card>
    </div>
  )
}

export default PhotosMapTab
