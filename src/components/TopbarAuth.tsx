import { Button } from '@mui/material'
import { useAccount, useIsAuthenticated, useMsal } from '@azure/msal-react'
import { isAuthConfigured, signOut } from '../auth/msal'

/**
 * Auth widgets for the topbar. Each is split in two so the MSAL hooks only
 * ever run under an MsalProvider: the outer components fall back statically
 * in auth-less mode (local dev, tests), where no provider exists.
 */

const TeacherNameInner = () => {
    const { accounts } = useMsal()
    const account = useAccount(accounts[0] ?? {})
    // First name only — a heading, not an identity record. The account's
    // display name can be absent on some account types; "Teacher" then.
    const firstName = account?.name?.trim().split(/\s+/)[0]
    return <>{firstName || 'Teacher'}</>
}

/** The signed-in teacher's first name, or "Teacher" when unknown. */
export const TeacherName = () =>
    isAuthConfigured() ? <TeacherNameInner /> : <>Teacher</>

/** 5–11 is morning, 12–17 afternoon, the rest evening. */
export const greetingForHour = (hour: number): string =>
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

/** The signed-in greeting block — also the auth-less default. */
const TeacherGreeting = ({ quote }: { quote: string }) => (
    <div className="topbar-greeting">
        <p className="eyebrow">Teacher portal</p>
        <h2>
            {greetingForHour(new Date().getHours())}, <TeacherName />
        </h2>
        <p className="welcome-quote">{quote}</p>
    </div>
)

/** Visitors get the site's name — it is not their portal, and the
    daily quote talks to the teacher, so it stays out too. */
const VisitorGreeting = () => (
    <div className="topbar-greeting">
        <p className="eyebrow">Springboard Tutoring</p>
        <h2>Personal tutoring</h2>
    </div>
)

const TopbarGreetingInner = ({ quote }: { quote: string }) =>
    useIsAuthenticated() ? (
        <TeacherGreeting quote={quote} />
    ) : (
        <VisitorGreeting />
    )

/** The topbar's left block: teacher welcome when signed in (or auth-less),
    site identity for signed-out visitors (REQ-003). */
export const TopbarGreeting = ({ quote }: { quote: string }) =>
    isAuthConfigured() ? (
        <TopbarGreetingInner quote={quote} />
    ) : (
        <TeacherGreeting quote={quote} />
    )

const TopbarAuthInner = () => {
    const { accounts } = useMsal()
    const account = useAccount(accounts[0] ?? {})
    const isAuthenticated = useIsAuthenticated()

    if (!isAuthenticated || !account) {
        return null
    }

    return (
        <div className="topbar-auth">
            {/* The tooltip carries the account's preferred_username — the
                exact value the API matches against the teacher allow-list —
                without the raw email breaking the topbar layout. */}
            <Button
                size="small"
                variant="text"
                title={`Signed in as ${account.username}`}
                onClick={() => void signOut()}
            >
                Sign out
            </Button>
        </div>
    )
}

export const TopbarAuth = () =>
    isAuthConfigured() ? <TopbarAuthInner /> : null
