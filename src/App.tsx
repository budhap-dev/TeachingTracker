import { useEffect, useState } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import {
    MsalProvider,
    useIsAuthenticated,
    useMsal,
} from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import { getMsalInstance, isAuthConfigured } from './auth/msal'
import {
    store,
    fetchStudentsRequested,
    fetchPaymentsRequested,
    fetchSessionsRequested,
    initialLoadSkipped,
} from './store/store'
import { useAppDispatch } from './hooks'
import { useTheme } from './hooks/useTheme'
import { OfflineNotice } from './components/OfflineNotice'
import { BusyBar } from './components/BusyBar'
import { NoticeToast } from './components/NoticeToast'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { MobileTabBar } from './components/MobileTabBar'
import { AppRoutes } from './ROUTE'
import './styles.scss'

/** Dispatches the app's initial data loads once `ready` turns true. */
const InitialData = ({ ready }: { ready: boolean }) => {
    const dispatch = useAppDispatch()
    useEffect(() => {
        if (!ready) {
            return
        }
        dispatch(fetchStudentsRequested())
        dispatch(fetchPaymentsRequested())
        dispatch(fetchSessionsRequested())
    }, [ready, dispatch])
    return null
}

/**
 * Under MSAL the initial loads wait for the redirect handshake to finish and
 * an account to exist. Firing earlier goes out tokenless and 401s now that
 * the API enforces auth (REQ-004 T4); signed out, nothing is fetched at all —
 * RequireTeacher is already showing the visitor landing — and the boot-time
 * loading flags are settled so the busy bar stops.
 */
const AuthGatedInitialData = () => {
    const { inProgress } = useMsal()
    const isAuthenticated = useIsAuthenticated()
    const dispatch = useAppDispatch()
    const settled = inProgress === InteractionStatus.None

    useEffect(() => {
        if (settled && !isAuthenticated) {
            dispatch(initialLoadSkipped())
        }
    }, [settled, isAuthenticated, dispatch])

    return <InitialData ready={settled && isAuthenticated} />
}

const InitialDataBoundary = () =>
    isAuthConfigured() ? <AuthGatedInitialData /> : <InitialData ready />

const AppShell = () => {
    const { theme, setTheme, activeTheme, muiTheme } = useTheme()
    // The mobile drawer opens from the Sidebar's own hamburger (teacher)
    // OR the visitor tab bar's Menu tab — so the state lives here.
    const [drawerOpen, setDrawerOpen] = useState(false)

    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <InitialDataBoundary />
            {/* Outside .app-shell: it must never join the layout grid. */}
            <BusyBar />
            <div className="app-shell">
                <Sidebar
                    sidebarBackground={activeTheme.sidebar}
                    theme={theme}
                    onSelectTheme={setTheme}
                    mobileNavOpen={drawerOpen}
                    onMobileNavChange={setDrawerOpen}
                />
                <main className="main-content">
                    <Topbar
                        theme={theme}
                        activeTheme={activeTheme}
                        onSelectTheme={setTheme}
                    />
                    <OfflineNotice />
                    <AppRoutes />
                </main>
                {/* Visitors' bottom tab bar (REQ-049, Option C): its Menu
                    tab is the drawer's only mobile trigger for them. */}
                <MobileTabBar
                    onMenu={() => setDrawerOpen(!drawerOpen)}
                    menuOpen={drawerOpen}
                    onMenuClose={() => setDrawerOpen(false)}
                />
                <NoticeToast />
            </div>
        </ThemeProvider>
    )
}

const App = () => {
    const app = (
        <Provider store={store}>
            {/* future flags: opt in to v7 behaviour now, silencing the two
                upgrade warnings the router prints in the console. */}
            {/* react-router 7 (REQ-040 audit fix): the v7 future flags are
                the defaults now, so the prop is gone. */}
            <BrowserRouter>
                <AppShell />
            </BrowserRouter>
        </Provider>
    )
    // Auth-less mode (no Entra config baked in) has no provider at all — the
    // app is byte-for-byte the pre-REQ-004 tree, which keeps tests and local
    // tooling working unchanged.
    const msal = getMsalInstance()
    return msal ? <MsalProvider instance={msal}>{app}</MsalProvider> : app
}

export default App
