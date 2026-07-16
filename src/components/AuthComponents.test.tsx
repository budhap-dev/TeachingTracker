import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { RequireTeacher } from './RequireTeacher'
import { SignInView } from './SignInView'
import { TeacherName, TopbarAuth } from './TopbarAuth'
import {
    isAuthConfigured,
    signIn,
    signOut,
    getMsalInstance,
} from '../auth/msal'
import App from '../App'

// The auth module is fully unit-tested on its own; components see a mock.
vi.mock('../auth/msal', () => ({
    isAuthConfigured: vi.fn(),
    getMsalInstance: vi.fn(),
    acquireApiToken: vi.fn().mockResolvedValue(null),
    signIn: vi.fn(),
    signOut: vi.fn(),
}))

// msal-react's templates/hooks, steered per-test via mockAccount.
let mockAccount: { username: string; name?: string } | null = null
const mockAuthenticated = () => mockAccount !== null
vi.mock('@azure/msal-react', () => ({
    MsalProvider: ({ children }: { children: ReactNode }) => (
        <div data-testid="msal-provider">{children}</div>
    ),
    AuthenticatedTemplate: ({ children }: { children: ReactNode }) =>
        mockAuthenticated() ? <>{children}</> : null,
    UnauthenticatedTemplate: ({ children }: { children: ReactNode }) =>
        mockAuthenticated() ? null : <>{children}</>,
    useMsal: () => ({ accounts: mockAccount ? [mockAccount] : [] }),
    useAccount: () => mockAccount,
    useIsAuthenticated: () => mockAuthenticated(),
}))

beforeEach(() => {
    vi.mocked(isAuthConfigured).mockReturnValue(true)
    mockAccount = { username: 'teacher@example.com', name: 'Ada Lovelace' }
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
        expect(screen.queryByText(/sign in to continue/i)).not.toBeInTheDocument()
    })

    it('shows the sign-in screen instead of the page when signed out', () => {
        mockAccount = null
        render(<RequireTeacher>secret page</RequireTeacher>)
        expect(screen.queryByText('secret page')).not.toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: /sign in to continue/i })
        ).toBeInTheDocument()
    })
})

describe('SignInView', () => {
    it('starts the Microsoft sign-in', async () => {
        const user = userEvent.setup()
        render(<SignInView />)
        await user.click(
            screen.getByRole('button', { name: /sign in with microsoft/i })
        )
        expect(signIn).toHaveBeenCalled()
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
    it('wraps the tree in MsalProvider when auth is configured', () => {
        vi.mocked(getMsalInstance).mockReturnValue(
            {} as ReturnType<typeof getMsalInstance>
        )
        render(<App />)
        expect(screen.getByTestId('msal-provider')).toBeInTheDocument()
    })
})
