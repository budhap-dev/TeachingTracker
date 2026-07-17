import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useIsAuthenticated } from '@azure/msal-react'
import { isAuthConfigured } from '../auth/msal'
import { appVersion } from '../version'
import { paths } from '../paths'

type NavItem = {
    label: string
    path: string
    /** True when the current location should highlight this item. */
    isActive: (pathname: string) => boolean
    /** Teacher-only items leave the menu for signed-out visitors (REQ-003). */
    teacherOnly?: boolean
}

const navItems: NavItem[] = [
    {
        label: 'Dashboard',
        path: paths.dashboard,
        isActive: (pathname) => pathname === paths.dashboard,
        teacherOnly: true,
    },
    {
        label: 'Students',
        path: paths.students,
        isActive: (pathname) => pathname.startsWith(paths.students),
        teacherOnly: true,
    },
    {
        label: 'Study Snapshot',
        path: paths.studySnapshot,
        isActive: (pathname) => pathname.startsWith(paths.studySnapshot),
        teacherOnly: true,
    },
    {
        label: 'Payment Tracker',
        path: paths.payments,
        isActive: (pathname) => pathname.startsWith(paths.payments),
        teacherOnly: true,
    },
    {
        label: 'Class scheduling',
        path: paths.scheduling,
        isActive: (pathname) => pathname.startsWith(paths.scheduling),
        teacherOnly: true,
    },
    {
        label: 'Offerings',
        path: paths.offerings,
        isActive: (pathname) => pathname.startsWith(paths.offerings),
    },
    {
        label: 'Contact us',
        path: paths.contact,
        isActive: (pathname) => pathname.startsWith(paths.contact),
    },
]

type SidebarProps = {
    sidebarBackground: string
}

type SidebarContentProps = SidebarProps & {
    showTeacherItems: boolean
}

const SidebarContent = ({
    sidebarBackground,
    showTeacherItems,
}: SidebarContentProps) => {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

    const visibleItems = navItems.filter(
        (item) => showTeacherItems || !item.teacherOnly
    )

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
                    <h1>Springboard</h1>
                    <p>Where confidence takes off.</p>
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
                {visibleItems.map((item) => (
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

/**
 * Under MSAL the menu is auth-aware: visitors get only the public pages
 * until they sign in. The hook lives in this inner component so it only
 * ever runs beneath an MsalProvider (same split as TopbarAuth).
 */
const SidebarSignedAware = (props: SidebarProps) => (
    <SidebarContent {...props} showTeacherItems={useIsAuthenticated()} />
)

export const Sidebar = (props: SidebarProps) =>
    isAuthConfigured() ? (
        <SidebarSignedAware {...props} />
    ) : (
        <SidebarContent {...props} showTeacherItems />
    )
