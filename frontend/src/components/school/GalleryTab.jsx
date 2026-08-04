import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'

/**
 * Tab Φωτογραφιών: gallery με ορισμό κύριας + διαγραφή.
 */
function GalleryTab({ gallery, mainImage, uploading, inputRef, onUpload, onSetMain, onDelete }) {
  return (
    <Card noBody title="Φωτογραφίες"
      action={<>
        <button className="btn btn-primary btn-sm" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? 'Ανέβασμα...' : '+ Προσθήκη Φωτογραφιών'}</button>
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={onUpload} style={{ display: 'none' }} />
      </>}>
      <div className="card-body">
        {gallery.length === 0
          ? <EmptyState>Δεν υπάρχουν φωτογραφίες ακόμα. Πρόσθεσε φωτογραφίες της σχολής!</EmptyState>
          : (
            <div className="dash-gallery">
              {gallery.map((img, idx) => (
                <div key={idx} className={`dash-gallery-item ${mainImage === img ? 'main' : ''}`}>
                  <div style={{ height: 130, background: `url(http://localhost:5000${img}) center/cover` }} />
                  {mainImage === img && <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>ΚΥΡΙΑ</div>}
                  <div style={{ display: 'flex', gap: 4, padding: 8 }}>
                    <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', background: 'var(--ice)', color: 'var(--navy)', fontSize: 11 }} onClick={() => onSetMain(img)}>Κύρια</button>
                    <button className="btn btn-danger btn-sm" style={{ justifyContent: 'center', fontSize: 11 }} onClick={() => onDelete(img)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </Card>
  )
}

export default GalleryTab
