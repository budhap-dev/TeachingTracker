import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useIsAuthenticated } from '@azure/msal-react'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import ReviewsOutlinedIcon from '@mui/icons-material/ReviewsOutlined'
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded'
import { isAuthConfigured } from '../auth/msal'
import { useAppDispatch, useAppSelector } from '../hooks'
import { fetchSiteContentRequested } from '../store/store'
import { paths } from '../paths'

/** The pages the owner may pin to the bar (REQ-049). Keys match the
    site document's mobileNav config; 'menu' is always the fifth tab. */
const NAV_PAGES: Record<
    string,
    { label: string; path: string; Icon: typeof HomeRoundedIcon }
> = {
    home: { label: 'Home', path: paths.dashboard, Icon: HomeRoundedIcon },
    offerings: {
        label: 'Offerings',
        path: paths.offerings,
        Icon: LocalOfferOutlinedIcon,
    },
    pricing: { label: 'Pricing', path: paths.pricing, Icon: SellOutlinedIcon },
    enquire: { label: 'Enquire', path: paths.enquire, Icon: SendRoundedIcon },
    about: {
        label: 'About',
        path: paths.about,
        Icon: PersonOutlineRoundedIcon,
    },
    reviews: {
        label: 'Reviews',
        path: paths.reviews,
        Icon: RateReviewOutlinedIcon,
    },
    faq: { label: 'FAQ', path: paths.faq, Icon: QuizOutlinedIcon },
    contact: {
        label: 'Contact',
        path: paths.contact,
        Icon: MailOutlineRoundedIcon,
    },
}

/** The teacher bar's vocabulary — the work screens (2026-08-10). */
const TEACHER_NAV_PAGES: Record<
    string,
    { label: string; path: string; Icon: typeof HomeRoundedIcon }
> = {
    dashboard: {
        label: 'Dashboard',
        path: paths.dashboard,
        Icon: SpaceDashboardRoundedIcon,
    },
    students: {
        label: 'Students',
        path: paths.students,
        Icon: GroupsRoundedIcon,
    },
    scheduling: {
        label: 'Classes',
        path: paths.scheduling,
        Icon: CalendarMonthRoundedIcon,
    },
    payments: {
        label: 'Payments',
        path: paths.payments,
        Icon: PaymentsRoundedIcon,
    },
    snapshot: {
        label: 'Snapshot',
        path: paths.studySnapshot,
        Icon: InsightsRoundedIcon,
    },
    leads: {
        label: 'Leads',
        path: paths.leads,
        Icon: ContactPageOutlinedIcon,
    },
    alumni: { label: 'Alumni', path: paths.alumni, Icon: SchoolRoundedIcon },
    moderation: {
        label: 'Reviews',
        path: paths.reviewsModeration,
        Icon: ReviewsOutlinedIcon,
    },
    editor: {
        label: 'Site',
        path: paths.siteEditor,
        Icon: LanguageRoundedIcon,
    },
}

type MobileTabBarProps = {
    /** Opens the existing drawer — the bar's Menu tab is its only
        mobile trigger for visitors. */
    onMenu: () => void
    /** True while the drawer is open — the Menu tab lifts too
        (owner call, 2026-08-10: the lift IS the selection). */
    menuOpen?: boolean
    /** Closes the drawer. A tab tapped while it is open navigates first,
        then closes it after a beat (owner ask, 2026-08-10). */
    onMenuClose?: () => void
}

const MobileTabBarInner = ({
    onMenu,
    menuOpen,
    onMenuClose,
    teacher = false,
}: MobileTabBarProps & { teacher?: boolean }) => {
    const dispatch = useAppDispatch()
    const { pathname } = useLocation()
    const nav = useAppSelector((state) =>
        teacher
            ? state.students.siteContent.mobileNavTeacher
            : state.students.siteContent.mobileNav
    )
    const pages = teacher ? TEACHER_NAV_PAGES : NAV_PAGES
    const contact = useAppSelector((state) => state.students.contact)
    useEffect(() => {
        dispatch(fetchSiteContentRequested())
    }, [dispatch])
    // The bar occupies real screen height — the layout pads for it.
    useEffect(() => {
        document.body.classList.add('has-tabbar')
        return () => document.body.classList.remove('has-tabbar')
    }, [])
    // The tap-through close: navigation happens instantly; the drawer
    // follows it shut after a beat, so the switch reads as deliberate.
    const closeTimer = useRef<ReturnType<typeof setTimeout>>()
    useEffect(() => () => clearTimeout(closeTimer.current), [])
    const closeSoon = () => {
        if (!menuOpen) {
            return
        }
        clearTimeout(closeTimer.current)
        closeTimer.current = setTimeout(() => onMenuClose?.(), 350)
    }

    const contactPublished = Boolean(contact.email || contact.phone)
    const allowed = (key: string) =>
        key in pages && (key !== 'contact' || contactPublished)
    const flat = nav.items.filter(allowed).slice(0, 3)
    const spotlight = allowed(nav.spotlight)
        ? nav.spotlight
        : teacher
          ? 'payments'
          : 'enquire'
    // Option C's slot order — spotlight holds the centre seat; the LIFT
    // travels with whichever tab is active (owner call, 2026-08-10).
    const slots: string[] = [
        ...(flat[0] ? [flat[0]] : []),
        ...(flat[1] ? [flat[1]] : []),
        spotlight,
        ...(flat[2] ? [flat[2]] : []),
    ]

    return (
        <nav className="mobile-tabbar" aria-label="Quick navigation">
            {slots.map((key) => {
                const page = pages[key]
                const active =
                    !menuOpen &&
                    (page.path === '/'
                        ? pathname === '/'
                        : pathname.startsWith(page.path))
                return (
                    <Link
                        key={key}
                        to={page.path}
                        className={`tab ${active ? 'raised active' : ''}`.trim()}
                        aria-current={active ? 'page' : undefined}
                        onClick={closeSoon}
                    >
                        <span className="tab-icon">
                            <page.Icon fontSize="small" />
                        </span>
                        {page.label}
                    </Link>
                )
            })}
            <button
                type="button"
                className={`tab ${menuOpen ? 'raised active' : ''}`.trim()}
                onClick={onMenu}
            >
                <span className="tab-icon">
                    <MenuRoundedIcon fontSize="small" />
                </span>
                Menu
            </button>
        </nav>
    )
}

/** Everyone gets a bar on phones now (owner call, 2026-08-10): the
    teacher's carries their configured work screens, visitors' the
    public set. Auth-less local dev counts as the teacher. */
const MobileTabBarGate = (props: MobileTabBarProps) => (
    <MobileTabBarInner {...props} teacher={useIsAuthenticated()} />
)

export const MobileTabBar = (props: MobileTabBarProps) =>
    isAuthConfigured() ? (
        <MobileTabBarGate {...props} />
    ) : (
        <MobileTabBarInner {...props} teacher />
    )
