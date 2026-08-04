import Sidebar from './Sidebar'

function DashboardShell({ sidebarProps, title, headerAction, children }) {
    return (
        <div className="dash-shell">
            <Sidebar {...sidebarProps} />
            <div className="dash-main">
                <header className="dash-header">
                    <div>
                        <h1 className="dash-title">{title}</h1>
                        <div className="dash-date">
                            {new Date().toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                    {headerAction}
                </header>
                <main className="dash-content">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default DashboardShell