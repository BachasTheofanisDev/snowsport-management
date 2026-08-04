import KpiCard from '../ui/KpiCard'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import EmptyState from '../ui/EmptyState'
import { LEVEL_LABEL, SPORT_ICON } from './constants'

/**
 * Tab Επισκόπησης: KPIs + πρόγραμμα σήμερα + λίστα εκπαιδευτών.
 */
function OverviewTab({ metrics, schoolAvgRating, totalAllReviews, instructors, onGoToSchedule }) {
  return (
    <div className="dash-stack">
      <div className="dash-kpis">
        <KpiCard label="Μαθήματα σήμερα" value={metrics.todayCount} sub={`${metrics.individual} ατομικά · ${metrics.group} ομαδικά συνολικά`} />
        <KpiCard label="Συνολικά έσοδα" value={`€${metrics.revenue.toLocaleString('el-GR')}`} sub="εκτός ακυρωμένων" color="var(--confirmed-text)" />
        <KpiCard label="Βαθμολογία σχολής" value={schoolAvgRating > 0 ? `${schoolAvgRating} ★` : '—'} sub={`${totalAllReviews} αξιολογήσεις`} color="#f59e0b" />
        <KpiCard label="Εκκρεμείς κρατήσεις" value={metrics.pending} sub="χρειάζονται ανάθεση" color="var(--pending-text)" />
      </div>

      <div className="dash-two-col">
        <Card title="Πρόγραμμα σήμερα" action={<button className="dash-link" onClick={onGoToSchedule}>Πλήρες πρόγραμμα →</button>}>
          {metrics.todaysLessons.length === 0
            ? <EmptyState>Δεν υπάρχουν μαθήματα προγραμματισμένα για σήμερα.</EmptyState>
            : metrics.todaysLessons.map(l => (
              <div key={l.id} className="dash-row">
                <span className="dash-row-time">{l.startTime || '—'}</span>
                <span className="dash-row-bar" style={{ background: l.sport === 'ski' ? '#7eb8f7' : '#17a2ad' }} />
                <div className="dash-row-main">
                  <div className="dash-row-title">{SPORT_ICON[l.sport]} {l.type === 'open_group' ? 'Ομαδικό' : 'Ατομικό'} · {l.bookings?.[0]?.customerName || '—'}</div>
                  <div className="dash-row-sub">{l.instructor?.name || 'Χωρίς εκπαιδευτή'} · {LEVEL_LABEL[l.level]}</div>
                </div>
                <span className={`badge badge-${l.status}`}>
                  {l.status === 'confirmed' ? 'Επιβεβ.' : l.status === 'pending' ? 'Εκκρεμεί' : 'Ακυρ.'}
                </span>
              </div>
            ))}
        </Card>

        <Card title="Εκπαιδευτές">
          {instructors.length === 0
            ? <EmptyState>Δεν υπάρχουν εκπαιδευτές ακόμα.</EmptyState>
            : instructors.map(ins => (
              <div key={ins.id} className="dash-ins-row">
                <Avatar name={ins.name} size="sm" />
                <div className="dash-ins-main">
                  <div className="dash-ins-name">{ins.name}</div>
                  <div className="dash-ins-sub">
                    {ins.specialty.map(s => s === 'ski' ? 'Σκι' : 'Snowboard').join(' · ')}
                    {ins.totalReviews > 0 && ` · ★ ${ins.avgRating}`}
                  </div>
                </div>
              </div>
            ))}
        </Card>
      </div>
    </div>
  )
}

export default OverviewTab
