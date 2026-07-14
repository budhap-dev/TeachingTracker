import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { appVersion } from '../version'
import { paths } from '../paths'

type NavItem = {
    label: string
    path: string
    /** True when the current location should highlight this item. */
    isActive: (pathname: string) => boolean
}

const navItems: NavItem[] = [
    {
        label: 'Dashboard',
        path: paths.dashboard,
        isActive: (pathname) => pathname === paths.dashboard,
    },
    {
        label: 'Students',
        path: paths.students,
        isActive: (pathname) => pathname.startsWith(paths.students),
    },
    {
        label: 'Study Snapshot',
        path: paths.studySnapshot,
        isActive: (pathname) => pathname.startsWith(paths.studySnapshot),
    },
    {
        label: 'Payment Tracker',
        path: paths.payments,
        isActive: (pathname) => pathname.startsWith(paths.payments),
    },
    {
        label: 'Class scheduling',
        path: paths.scheduling,
        isActive: (pathname) => pathname.startsWith(paths.scheduling),
    },
]

type SidebarProps = {
    sidebarBackground: string
}

export const Sidebar = ({ sidebarBackground }: SidebarProps) => {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

    const handleNavigate = (path: string) => {
        navigate(path)
        setIsMobileNavOpen(false)
    }

    return (
        <aside
            className={`sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}
            style={{ backgroundImage: sidebarBackground }}
        >
            <div className="sidebar-header">
                <div>
                    <h1>TeachTrack</h1>
                    <p>
                        One teacher dashboard for student growth and study
                        snapshots.
                    </p>
                </div>
                <button
                    type="button"
                    className="mobile-nav-toggle"
                    onClick={() => setIsMobileNavOpen((current) => !current)}
                    aria-label={
                        isMobileNavOpen ? 'Close navigation' : 'Open navigation'
                    }
                    aria-expanded={isMobileNavOpen}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        className={item.isActive(pathname) ? 'active' : ''}
                        onClick={() => handleNavigate(item.path)}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
            <footer className="sidebar-footer">
                <span>Version {appVersion}</span>
            </footer>
        </aside>
    )
}
