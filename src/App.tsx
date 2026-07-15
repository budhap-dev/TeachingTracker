import { useEffect } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import {
    store,
    fetchStudentsRequested,
    fetchPaymentsRequested,
    fetchSessionsRequested,
} from './store/store'
import { useAppDispatch } from './hooks'
import { useTheme } from './hooks/useTheme'
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
            </div>
        </ThemeProvider>
    )
}

const App = () => (
    <Provider store={store}>
        <BrowserRouter>
            <AppShell />
        </BrowserRouter>
    </Provider>
)

export default App
