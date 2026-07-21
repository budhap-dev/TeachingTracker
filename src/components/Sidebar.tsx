import { useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useIsAuthenticated } from '@azure/msal-react'
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import { isAuthConfigured } from '../auth/msal'
import { appVersion } from '../version'
import { paths } from '../paths'

type NavItem = {
    label: string
    path: string
    /** A leading glyph for the menu row. */
    icon: ReactNode
    /** True when the current location should highlight this item. */
    isActive: (pathname: string) => boolean
    /** Teacher-only items leave the menu for signed-out visitors (REQ-003). */
    teacherOnly?: boolean
}

const navItems: NavItem[] = [
    {
        label: 'Dashboard',
        path: paths.dashboard,
        icon: <SpaceDashboardOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname === paths.dashboard,
        teacherOnly: true,
    },
    {
        label: 'Students',
        path: paths.students,
        icon: <GroupsOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.students),
        teacherOnly: true,
    },
    {
        label: 'Study Snapshot',
        path: paths.studySnapshot,
        icon: <InsightsOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.studySnapshot),
        teacherOnly: true,
    },
    {
        label: 'Alumni',
        path: paths.alumni,
        icon: <SchoolOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.alumni),
        teacherOnly: true,
    },
    {
        label: 'Payment Tracker',
        path: paths.payments,
        icon: <PaymentsOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.payments),
        teacherOnly: true,
    },
    {
        label: 'Class scheduling',
        path: paths.scheduling,
        icon: <CalendarMonthOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.scheduling),
        teacherOnly: true,
    },
    {
        label: 'Review moderation',
        path: paths.reviewsModeration,
        icon: <FactCheckOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname === paths.reviewsModeration,
        teacherOnly: true,
    },
    {
        label: 'Offerings',
        path: paths.offerings,
        icon: <LocalOfferOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.offerings),
    },
    {
        label: 'Contact us',
        path: paths.contact,
        icon: <MailOutlineRoundedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.contact),
    },
    {
        label: 'Reviews',
        path: paths.reviews,
        icon: <RateReviewOutlinedIcon fontSize="small" />,
        // Exact match so it doesn't also light up on /reviews/moderation.
        isActive: (pathname) => pathname === paths.reviews,
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
                        <span className="nav-icon" aria-hidden="true">
                            {item.icon}
                        </span>
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
