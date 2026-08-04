import Avatar from './Avatar'
import { useTheme } from '../../context/ThemeContext'

function Sidebar({ brand, brandSub, logo = '🏔', navItems, activeTab, onTabChange, user, onLogout }) {
    const { theme, toggleTheme } = useTheme()

    return (
        <aside className="dash-sidebar">
            <div className="dash-brand">
                <div className="dash-logo">{logo}</div>
                <div>
                    <div className="dash-brand-name">{brand}</div>
                    <div className="dash-brand-sub">{brandSub}</div>
                </div>
            </div>

            <nav className="dash-nav">
                {navItems.map(item => (
                    <button key={item.id}
                        className={`dash-nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => onTabChange(item.id)}>
                        <span className="dash-nav-dot" style={{ background: item.dot }} />
                        <span>{item.label}</span>
                        {item.badge != null && <span className="dash-nav-badge">{item.badge}</span>}
                    </button>
                ))}
            </nav>

            <div className="dash-user">
                <Avatar name={user?.name} />
                <div className="dash-user-info">
                    <div className="dash-user-email">{user?.email || user?.name}</div>
                    <button className="dash-logout" onClick={onLogout}>Αποσύνδεση</button>
                </div>
                <button className="dash-theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Φωτεινό' : 'Σκοτεινό'}>
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
            </div>
        </aside>
    )
}

export default Sidebar