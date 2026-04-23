import { useState, useEffect } from 'react'
import { getStats } from '../api'

function StatsPanel() {
    const [stats, setStats] = useState(null)
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0])
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
    const [rangeMode, setRangeMode] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        setLoading(true)
        try {
            const res = await getStats(dateFrom, rangeMode ? dateTo : dateFrom)
            setStats(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            {/* Φίλτρα */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{rangeMode ? 'Από' : 'Ημερομηνία'}</label>
                            <input className="form-input" type="date" value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)} />
                        </div>

                        {rangeMode && (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Έως</label>
                                <input className="form-input" type="date" value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    min={dateFrom} />
                            </div>
                        )}

                        <button className={`btn ${rangeMode ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => setRangeMode(!rangeMode)}>
                            {rangeMode ? 'Μία ημερομηνία' : 'Εύρος ημερομηνιών'}
                        </button>

                        <button className="btn btn-primary" onClick={fetchStats} disabled={loading}>
                            {loading ? 'Φόρτωση...' : '🔍 Αναζήτηση'}
                        </button>
                    </div>
                </div>
            </div>

            {stats && (
                <>
                    {/* Συνολικά στατιστικά */}
                    <div className="stats-grid" style={{ marginBottom: '1rem' }}>
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
                            <div className="stat-label">Επιβεβαιωμένα</div>
                            <div className="stat-value green">{stats.confirmedLessons}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Εκκρεμή</div>
                            <div className="stat-value amber">{stats.pendingLessons}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Συνολικά Έσοδα</div>
                            <div className="stat-value green">{stats.totalRevenue}€</div>
                        </div>
                    </div>

                    {/* Έσοδα ανά εκπαιδευτή */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Έσοδα ανά Εκπαιδευτή</span>
                        </div>
                        <div className="card-body">
                            {stats.revenueByInstructor.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Δεν υπάρχουν δεδομένα για αυτή την περίοδο.</p>
                            ) : (
                                stats.revenueByInstructor
                                    .sort((a, b) => b.revenue - a.revenue)
                                    .map(instructor => (
                                        <div key={instructor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '0.5px solid var(--border)' }}>
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: 14 }}>{instructor.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                    {instructor.lessons} μάθημα{instructor.lessons > 1 ? 'τα' : ''}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 500, fontSize: 16, color: '#3B6D11' }}>
                                                {instructor.revenue}€
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default StatsPanel