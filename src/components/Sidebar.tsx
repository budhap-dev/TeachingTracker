import { useEffect, useState } from 'react'
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
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import { isAuthConfigured } from '../auth/msal'
import { useAppDispatch, useAppSelector } from '../hooks'
import type { RootState } from '../store/store'
import { selectNewEnquiries, selectPendingReviews } from '../store/waiting'
import { fetchContactRequested } from '../store/store'
import { appVersion, isProdBuild } from '../version'
import { paths } from '../paths'
import { BrandLogo } from './BrandLogo'
import { BrandBadge } from './BrandBadge'
import { useIsPhone } from '../hooks/useIsPhone'
import { TopbarAuth } from './TopbarAuth'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import {
    themePresets,
    type ThemeName,
    type ThemePreset,
} from '../utils/constants'

type NavItem = {
    label: string
    /** Hidden from visitors while the published contact details are all
        blank — an empty Contact page is a dead end (owner call,
        2026-08-07). The teacher always sees it, to fill it in. */
    needsContact?: boolean
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
    /** Reads the count waiting behind this item, if any (REQ-056). */
    waiting?: (state: RootState) => number
}

/**
 * One menu row. Items that carry something waiting (REQ-056 — Leads and
 * Review moderation) wear the number, so it is visible from every screen and
 * not only from the dashboard. Nothing waiting means no badge at all.
 */
const NavButton = ({
    item,
    active,
    onNavigate,
}: {
    item: NavItem
    active: boolean
    onNavigate: (path: string) => void
}) => {
    const waiting = useAppSelector((state) =>
        item.waiting ? item.waiting(state) : 0
    )
    return (
        <button
            className={active ? 'active' : ''}
            onClick={() => onNavigate(item.path)}
            // Without this the name reads "Leads 3", which could be a count
            // or part of the label.
            aria-label={waiting > 0 ? `${item.label}, ${waiting} waiting` : undefined}
        >
            <span className="nav-icon" aria-hidden="true">
                {item.icon}
            </span>
            {item.label}
            {waiting > 0 && (
                <span className="nav-count" aria-hidden="true">
                    {waiting}
                </span>
            )}
        </button>
    )
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
        waiting: selectNewEnquiries,
    },
    {
        label: 'Review moderation',
        path: paths.reviewsModeration,
        icon: <FactCheckOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname === paths.reviewsModeration,
        teacherOnly: true,
        waiting: selectPendingReviews,
    },
    {
        label: 'Public site',
        path: paths.siteEditor,
        icon: <LanguageOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.siteEditor),
        teacherOnly: true,
    },
    {
        label: 'About',
        path: paths.about,
        icon: <PersonOutlineRoundedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.about),
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
        label: 'Contact me',
        needsContact: true,
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
        label: 'FAQ',
        path: paths.faq,
        icon: <QuizOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.faq),
    },
    {
        label: 'Pricing',
        path: paths.pricing,
        icon: <SellOutlinedIcon fontSize="small" />,
        isActive: (pathname) => pathname.startsWith(paths.pricing),
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
    /** Present when the drawer should carry the theme picker — phones
        hide the greeting band off-Home (owner call, 2026-08-10), so its
        tools live here. */
    theme?: ThemeName
    onSelectTheme?: (theme: ThemeName) => void
    /** Controlled drawer state (REQ-049): the visitor tab bar's Menu tab
        needs to open the drawer from outside. Omitted = uncontrolled. */
    mobileNavOpen?: boolean
    onMobileNavChange?: (open: boolean) => void
}

type SidebarContentProps = SidebarProps & {
    showTeacherItems: boolean
}

const SidebarContent = ({
    sidebarBackground,
    showTeacherItems,
    theme,
    onSelectTheme,
    mobileNavOpen,
    onMobileNavChange,
}: SidebarContentProps) => {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [internalNavOpen, setInternalNavOpen] = useState(false)
    // Controlled when the app supplies the pair; internal otherwise.
    const isMobileNavOpen = mobileNavOpen ?? internalNavOpen
    const setIsMobileNavOpen = (
        next: boolean | ((current: boolean) => boolean)
    ) => {
        const value =
            typeof next === 'function' ? next(isMobileNavOpen) : next
        setInternalNavOpen(value)
        onMobileNavChange?.(value)
    }
    // The drawer's theme section stays collapsed behind the same quiet
    // palette toggle as the topbar (owner call, 2026-08-10 — a wall of
    // swatches always open was worse).
    const [isThemeOpen, setIsThemeOpen] = useState(false)
    // The badge grows on the phone band; CSS cannot reach its glyph sizes.
    const isPhone = useIsPhone()
    const dispatch = useAppDispatch()
    // The menu needs the published contact details to decide whether the
    // Contact entry earns its place; the page itself fetches too — the
    // GET is idempotent and silent on failure.
    const contact = useAppSelector((state) => state.students.contact)
    useEffect(() => {
        dispatch(fetchContactRequested())
    }, [dispatch])
    const contactPublished = Boolean(contact.email || contact.phone)

    const visibleItems = navItems
        .filter((item) =>
            showTeacherItems ? !item.visitorOnly : !item.teacherOnly
        )
        .filter(
            (item) =>
                !item.needsContact || showTeacherItems || contactPublished
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
                    <BrandBadge size={isPhone ? 62 : 50} />
                    <div>
                        <h1 aria-label="AbhiTutor">
                            <BrandLogo />
                        </h1>
                        <p>Where confidence takes off.</p>
                    </div>
                </div>
                <button
                    type="button"
                    className="mobile-nav-toggle visitor-hidden"
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
            {/* Phones: tapping the dimmed page closes the drawer. Rendered
                only while open; desktop never opens it (toggle is hidden). */}
            {isMobileNavOpen && (
                <div
                    className="mobile-nav-backdrop"
                    onClick={() => setIsMobileNavOpen(false)}
                    aria-hidden="true"
                />
            )}
            {/* display: contents on desktop — the drawer only materialises
                as a fixed panel in the phone layout. */}
            <div className="sidebar-drawer">
            <nav className="sidebar-nav" aria-label="Main menu">
                {groups.map((group) => (
                    <div key={group.label} className="sidebar-nav-group">
                        {groups.length > 1 && (
                            <p className="sidebar-nav-group-label">
                                {group.label}
                            </p>
                        )}
                        {group.items.map((item) => (
                            <NavButton
                                key={item.path}
                                item={item}
                                active={item.isActive(pathname)}
                                onNavigate={handleNavigate}
                            />
                        ))}
                    </div>
                ))}
            </nav>
            {/* Phone-only drawer tools: the theme swatches and sign-out
                that the hidden off-Home topbar would have carried. */}
            {onSelectTheme && theme && (
                <div className="sidebar-mobile-tools">
                    <button
                        type="button"
                        className="theme-toggle sidebar-theme-toggle"
                        onClick={() => setIsThemeOpen((current) => !current)}
                        aria-expanded={isThemeOpen}
                        aria-label={
                            isThemeOpen ? 'Hide themes' : 'Choose a theme'
                        }
                    >
                        <PaletteOutlinedIcon fontSize="small" />
                        <span
                            className="theme-toggle-dot"
                            style={{
                                background: `linear-gradient(135deg, ${themePresets[theme].accent} 50%, ${themePresets[theme].accentAlt} 50%)`,
                            }}
                        />
                        Theme
                    </button>
                    {isThemeOpen && (
                    <div className="sidebar-theme-row">
                        {(
                            Object.entries(themePresets) as [
                                ThemeName,
                                ThemePreset,
                            ][]
                        ).map(([themeKey, preset]) => (
                            <button
                                key={themeKey}
                                type="button"
                                className={`theme-swatch ${theme === themeKey ? 'active' : ''}`}
                                onClick={() => onSelectTheme(themeKey)}
                                aria-label={`Select ${preset.label} theme`}
                                title={preset.label}
                            >
                                <span
                                    className="swatch-accent"
                                    style={{ background: preset.accent }}
                                />
                                <span
                                    className="swatch-accent-alt"
                                    style={{
                                        background: preset.accentAlt,
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                    )}
                </div>
            )}
            {/* The footer row: version left, sign-out beside it (owner
                call, 2026-08-10) — nothing renders signed-out/auth-less. */}
            <footer className="sidebar-footer">
                {/* Non-prod names itself, like the badge's yellow ring. */}
                <span>
                    Version {appVersion}
                    {!isProdBuild && ' (dev)'}
                </span>
                <TopbarAuth />
            </footer>
            </div>
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
