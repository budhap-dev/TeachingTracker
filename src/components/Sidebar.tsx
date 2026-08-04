import { useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useIsAuthenticated } from '@azure/msal-react'
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import { isAuthConfigured } from '../auth/msal'
import { appVersion } from '../version'
import { paths } from '../paths'
import { BrandLogo } from './BrandLogo'
import { BrandBadge } from './BrandBadge'

type NavItem = {
    label: string
    path: string
    /** A leading glyph for the menu row. */
    icon: ReactNode
    /** True when the current location should highlight this item. */
    isActive: (pathname: string) => boolean
    /** Teacher-only items leave the menu for signed-out visitors (REQ-003). */
    teacherOnly?: boolean
    /** Visitor-only items leave the menu for the signed-in teacher — Home
        shares the root path with the Dashboard (REQ-024). */
    visitorOnly?: boolean
}

const navItems: NavItem[] = [
    {
        label: 'Home',
        path: paths.dashboard,
        icon: <HomeOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname === paths.dashboard,
        visitorOnly: true,
    },
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
        label: 'Class scheduling',
        path: paths.scheduling,
        icon: <CalendarMonthOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.scheduling),
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
        label: 'Study Snapshot',
        path: paths.studySnapshot,
        icon: <InsightsOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.studySnapshot),
        teacherOnly: true,
    },
    {
        label: 'Leads',
        path: paths.leads,
        icon: <InboxOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.leads),
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
        label: 'Public site',
        path: paths.siteEditor,
        icon: <LanguageOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.siteEditor),
        teacherOnly: true,
    },
    {
        label: 'Offerings',
        path: paths.offerings,
        icon: <LocalOfferOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.offerings),
    },
    {
        label: 'Enquire',
        path: paths.enquire,
        icon: <SendOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.enquire),
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
    {
        label: 'Privacy',
        path: paths.privacy,
        icon: <PrivacyTipOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.privacy),
    },
    {
        label: 'Alumni',
        path: paths.alumni,
        icon: <SchoolOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.alumni),
        teacherOnly: true,
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

    const visibleItems = navItems.filter((item) =>
        showTeacherItems
            ? !item.visitorOnly
            : !item.teacherOnly
    )

    // Two menu groups: the teacher's private workspace and the public-facing
    // site. An empty group is skipped, so signed-out visitors get just the
    // public items — and with only one group left there is no split to label,
    // so the "External" heading is dropped too.
    const groups: { label: string; items: NavItem[] }[] = [
        {
            label: 'Teacher',
            items: visibleItems.filter((item) => item.teacherOnly),
        },
        {
            label: 'External',
            items: visibleItems.filter((item) => !item.teacherOnly),
        },
    ].filter((group) => group.items.length > 0)

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
                <div className="sidebar-brand">
                    <BrandBadge size={50} />
                    <div>
                        <h1 aria-label="AbhiTutor">
                            <BrandLogo />
                        </h1>
                        <p>Where confidence takes off.</p>
                    </div>
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
                {groups.map((group) => (
                    <div key={group.label} className="sidebar-nav-group">
                        {groups.length > 1 && (
                            <p className="sidebar-nav-group-label">
                                {group.label}
                            </p>
                        )}
                        {group.items.map((item) => (
                            <button
                                key={item.path}
                                className={
                                    item.isActive(pathname) ? 'active' : ''
                                }
                                onClick={() => handleNavigate(item.path)}
                            >
                                <span className="nav-icon" aria-hidden="true">
                                    {item.icon}
                                </span>
                                {item.label}
                            </button>
                        ))}
                    </div>
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
