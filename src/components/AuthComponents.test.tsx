import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { RequireTeacher } from './RequireTeacher'
import { Sidebar } from './Sidebar'
import { SignInView } from './SignInView'
import { TeacherName, TopbarAuth, TopbarGreeting } from './TopbarAuth'
import {
    isAuthConfigured,
    signIn,
    signOut,
    getMsalInstance,
} from '../auth/msal'
import {
    store,
    fetchSessionsRequested,
    fetchStudentsRequested,
    initialLoadSkipped,
} from '../store/store'
import App from '../App'

// The auth module is fully unit-tested on its own; components see a mock.
vi.mock('../auth/msal', () => ({
    isAuthConfigured: vi.fn(),
    getMsalInstance: vi.fn(),
    acquireApiToken: vi.fn().mockResolvedValue(null),
    signIn: vi.fn(),
    signOut: vi.fn(),
}))

// msal-react's templates/hooks, steered per-test via mockAccount and
// mockInProgress ('none' = the interaction/redirect dance has settled).
let mockAccount: { username: string; name?: string } | null = null
let mockInProgress = 'none'
const mockAuthenticated = () => mockAccount !== null
vi.mock('@azure/msal-react', () => ({
    MsalProvider: ({ children }: { children: ReactNode }) => (
        <div data-testid="msal-provider">{children}</div>
    ),
    AuthenticatedTemplate: ({ children }: { children: ReactNode }) =>
        mockAuthenticated() ? <>{children}</> : null,
    UnauthenticatedTemplate: ({ children }: { children: ReactNode }) =>
        mockAuthenticated() ? null : <>{children}</>,
    useMsal: () => ({
        accounts: mockAccount ? [mockAccount] : [],
        inProgress: mockInProgress,
    }),
    useAccount: () => mockAccount,
    useIsAuthenticated: () => mockAuthenticated(),
}))

beforeEach(() => {
    vi.mocked(isAuthConfigured).mockReturnValue(true)
    mockAccount = { username: 'teacher@example.com', name: 'Ada Lovelace' }
    mockInProgress = 'none'
})

describe('RequireTeacher', () => {
    it('renders the page directly in auth-less mode', () => {
        vi.mocked(isAuthConfigured).mockReturnValue(false)
        render(<RequireTeacher>secret page</RequireTeacher>)
        expect(screen.getByText('secret page')).toBeInTheDocument()
    })

    it('renders the page when signed in', () => {
        render(<RequireTeacher>secret page</RequireTeacher>)
        expect(screen.getByText('secret page')).toBeInTheDocument()
        expect(
            screen.queryByText(/welcome to springboard/i)
        ).not.toBeInTheDocument()
    })

    // Signed-out behaviour is route-aware: deep links bounce to the
    // dashboard (deliberately not preserved), where the sign-in ask lives.
    const gatedRoutes = (
        <Routes>
            <Route
                path="/"
                element={<RequireTeacher>dash content</RequireTeacher>}
            />
            <Route
                path="/students"
                element={<RequireTeacher>students content</RequireTeacher>}
            />
        </Routes>
    )

    it('bounces a signed-out deep link to the dashboard sign-in', () => {
        mockAccount = null
        render(
            <MemoryRouter initialEntries={['/students']}>
                {gatedRoutes}
            </MemoryRouter>
        )
        expect(
            screen.queryByText('students content')
        ).not.toBeInTheDocument()
        expect(screen.queryByText('dash content')).not.toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: /welcome to springboard/i })
        ).toBeInTheDocument()
    })

    it('asks for sign-in on the dashboard itself when signed out', () => {
        mockAccount = null
        render(<MemoryRouter initialEntries={['/']}>{gatedRoutes}</MemoryRouter>)
        expect(
            screen.getByRole('heading', { name: /welcome to springboard/i })
        ).toBeInTheDocument()
    })
})

describe('SignInView', () => {
    it('starts the Microsoft sign-in', async () => {
        const user = userEvent.setup()
        render(
            <MemoryRouter>
                <SignInView />
            </MemoryRouter>
        )
        await user.click(
            screen.getByRole('button', { name: /sign in with microsoft/i })
        )
        expect(signIn).toHaveBeenCalled()
    })

    it('points visitors at the public pages', () => {
        render(
            <MemoryRouter>
                <SignInView />
            </MemoryRouter>
        )
        expect(
            screen.getByRole('link', { name: /what we offer/i })
        ).toHaveAttribute('href', '/offerings')
        expect(
            screen.getByRole('link', { name: /get in touch/i })
        ).toHaveAttribute('href', '/contact')
    })
})

describe('Sidebar', () => {
    const renderSidebar = () =>
        render(
            <MemoryRouter>
                <Sidebar sidebarBackground="none" />
            </MemoryRouter>
        )
    const teacherItem = () =>
        screen.queryByRole('button', { name: /payment tracker/i })
    const publicItem = () =>
        screen.getByRole('button', { name: /offerings/i })

    it('shows the whole menu in auth-less mode', () => {
        vi.mocked(isAuthConfigured).mockReturnValue(false)
        renderSidebar()
        expect(teacherItem()).toBeInTheDocument()
        expect(publicItem()).toBeInTheDocument()
    })

    it('hides teacher items from signed-out visitors', () => {
        mockAccount = null
        renderSidebar()
        expect(teacherItem()).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: /dashboard/i })
        ).not.toBeInTheDocument()
        expect(publicItem()).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: /contact us/i })
        ).toBeInTheDocument()
    })

    it('shows the whole menu once signed in', () => {
        renderSidebar()
        expect(teacherItem()).toBeInTheDocument()
        expect(publicItem()).toBeInTheDocument()
    })
})

describe('TopbarGreeting', () => {
    it('welcomes the teacher back when signed in', () => {
        render(<TopbarGreeting quote="Keep going" />)
        expect(
            screen.getByRole('heading', { name: /welcome back, ada/i })
        ).toBeInTheDocument()
        expect(screen.getByText('Keep going')).toBeInTheDocument()
    })

    it('shows the site identity to signed-out visitors — no welcome, no quote', () => {
        mockAccount = null
        render(<TopbarGreeting quote="Keep going" />)
        expect(
            screen.getByRole('heading', { name: /personal tutoring/i })
        ).toBeInTheDocument()
        expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument()
        expect(screen.queryByText('Keep going')).not.toBeInTheDocument()
    })

    it('keeps the teacher welcome in auth-less mode', () => {
        vi.mocked(isAuthConfigured).mockReturnValue(false)
        render(<TopbarGreeting quote="Keep going" />)
        expect(
            screen.getByRole('heading', { name: /welcome back, teacher/i })
        ).toBeInTheDocument()
    })
})

describe('TopbarAuth', () => {
    it('renders nothing in auth-less mode', () => {
        vi.mocked(isAuthConfigured).mockReturnValue(false)
        const { container } = render(<TopbarAuth />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renders nothing while signed out', () => {
        mockAccount = null
        const { container } = render(<TopbarAuth />)
        expect(container).toBeEmptyDOMElement()
    })

    it('keeps the allow-list identity discoverable via the tooltip', () => {
        render(<TopbarAuth />)
        expect(
            screen.getByRole('button', { name: /sign out/i })
        ).toHaveAttribute('title', 'Signed in as teacher@example.com')
        // The raw email no longer sits in the layout.
        expect(
            screen.queryByText('teacher@example.com')
        ).not.toBeInTheDocument()
    })

    it('signs out', async () => {
        const user = userEvent.setup()
        render(<TopbarAuth />)
        await user.click(screen.getByRole('button', { name: /sign out/i }))
        expect(signOut).toHaveBeenCalled()
    })
})

describe('TeacherName', () => {
    it('is "Teacher" in auth-less mode', () => {
        vi.mocked(isAuthConfigured).mockReturnValue(false)
        render(<TeacherName />)
        expect(screen.getByText('Teacher')).toBeInTheDocument()
    })

    it('is the signed-in first name', () => {
        render(<TeacherName />)
        expect(screen.getByText('Ada')).toBeInTheDocument()
    })

    it('falls back to "Teacher" when the account has no display name', () => {
        mockAccount = { username: 'teacher@example.com' }
        render(<TeacherName />)
        expect(screen.getByText('Teacher')).toBeInTheDocument()
    })

    it('falls back to "Teacher" while signed out', () => {
        mockAccount = null
        render(<TeacherName />)
        expect(screen.getByText('Teacher')).toBeInTheDocument()
    })
})

describe('App under MSAL', () => {
    beforeEach(() => {
        vi.mocked(getMsalInstance).mockReturnValue(
            {} as ReturnType<typeof getMsalInstance>
        )
    })

    it('wraps the tree in MsalProvider when auth is configured', () => {
        render(<App />)
        expect(screen.getByTestId('msal-provider')).toBeInTheDocument()
    })

    // The initial data loads must wait for auth: fired earlier they go out
    // tokenless and 401 against the enforced API (the bug behind "no data
    // loaded" after sign-in).
    const dispatchedTypes = (spy: ReturnType<typeof vi.spyOn>) =>
        spy.mock.calls.map(([action]) => (action as { type: string }).type)

    it('fetches once signed in and the redirect dance has settled', () => {
        const spy = vi.spyOn(store, 'dispatch')
        render(<App />)
        expect(dispatchedTypes(spy)).toContain(fetchStudentsRequested().type)
        expect(dispatchedTypes(spy)).toContain(fetchSessionsRequested().type)
        spy.mockRestore()
    })

    it('fetches nothing while signed out, and settles the loaders', () => {
        mockAccount = null
        const spy = vi.spyOn(store, 'dispatch')
        render(<App />)
        expect(dispatchedTypes(spy)).not.toContain(
            fetchStudentsRequested().type
        )
        // Boot-time loading flags are released, or the busy bar runs forever.
        expect(dispatchedTypes(spy)).toContain(initialLoadSkipped().type)
        expect(store.getState().students.sessionsLoading).toBe(false)
        spy.mockRestore()
    })

    it('fetches nothing while the auth redirect is still settling', () => {
        mockInProgress = 'handleRedirect'
        const spy = vi.spyOn(store, 'dispatch')
        render(<App />)
        expect(dispatchedTypes(spy)).not.toContain(
            fetchStudentsRequested().type
        )
        // Not settled yet: the skeletons stay — this is a real pending state.
        expect(dispatchedTypes(spy)).not.toContain(initialLoadSkipped().type)
        spy.mockRestore()
    })
})
