import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from '@mui/material'
import { useAccount, useIsAuthenticated, useMsal } from '@azure/msal-react'
import { useState } from 'react'
import { isAuthConfigured, signOut } from '../auth/msal'
import { BrandLogo } from './BrandLogo'

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

/** Visitors get the site's identity — the signed AbhiTutor lockup as the
    headline, the offer as the eyebrow — and the same daily teaching
    quote the teacher sees (owner call, 2026-08-09): it speaks to
    parents just as well. */
const VisitorGreeting = ({ quote }: { quote: string }) => (
    <div className="topbar-greeting">
        <h2 aria-label="AbhiTutor">
            <BrandLogo />
        </h2>
        <p className="eyebrow visitor-offer-line">
            Maths &amp; sciences · Years 7 to 13
        </p>
        <p className="welcome-quote">{quote}</p>
    </div>
)

const TopbarGreetingInner = ({ quote }: { quote: string }) =>
    useIsAuthenticated() ? (
        <TeacherGreeting quote={quote} />
    ) : (
        <VisitorGreeting quote={quote} />
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
    // A tap on Sign out asks first (owner ask, 2026-08-10) — it sits
    // beside the version line where a scroll-flick can graze it.
    const [confirming, setConfirming] = useState(false)

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
                onClick={() => setConfirming(true)}
            >
                Sign out
            </Button>
            <Dialog
                open={confirming}
                onClose={() => setConfirming(false)}
                maxWidth="xs"
            >
                <DialogTitle>Sign out?</DialogTitle>
                <DialogContent>
                    You&apos;ll need your Microsoft sign-in to get back
                    into the teacher portal.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirming(false)}>
                        Stay signed in
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => void signOut()}
                    >
                        Sign out
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

export const TopbarAuth = () =>
    isAuthConfigured() ? <TopbarAuthInner /> : null
