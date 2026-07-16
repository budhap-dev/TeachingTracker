import { useEffect } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { MsalProvider } from '@azure/msal-react'
import { getMsalInstance } from './auth/msal'
import {
    store,
    fetchStudentsRequested,
    fetchPaymentsRequested,
    fetchSessionsRequested,
} from './store/store'
import { useAppDispatch } from './hooks'
import { useTheme } from './hooks/useTheme'
import { BusyBar } from './components/BusyBar'
import { NoticeToast } from './components/NoticeToast'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { AppRoutes } from './ROUTE'
import './styles.scss'

const AppShell = () => {
    const dispatch = useAppDispatch()
    const { theme, setTheme, activeTheme, muiTheme } = useTheme()

    useEffect(() => {
        dispatch(fetchStudentsRequested())
        dispatch(fetchPaymentsRequested())
        dispatch(fetchSessionsRequested())
    }, [dispatch])

    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            {/* Outside .app-shell: it must never join the layout grid. */}
            <BusyBar />
            <div className="app-shell">
                <Sidebar sidebarBackground={activeTheme.sidebar} />
                <main className="main-content">
                    <Topbar
                        theme={theme}
                        activeTheme={activeTheme}
                        onSelectTheme={setTheme}
                    />
                    <AppRoutes />
                </main>
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
            <BrowserRouter
                future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
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
