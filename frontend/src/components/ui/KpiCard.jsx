function KpiCard({ label, value, sub, color }) {
    return (
        <div className="dash-kpi">
            <div className="dash-kpi-label">{label}</div>
            <div className="dash-kpi-value" style={color ? { color } : undefined}>{value}</div>
            {sub && <div className="dash-kpi-sub">{sub}</div>}
        </div>
    )
}

export default KpiCard