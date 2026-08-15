import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
    AuthenticatedTemplate,
    UnauthenticatedTemplate,
} from '@azure/msal-react'
import { isAuthConfigured } from '../auth/msal'
import { paths } from '../paths'
import { HomeLanding } from './HomeView'
import { CountPageVisit } from './CountPageVisit'

/**
 * Signed out, every teacher route bounces to the site root, which now shows
 * the marketing Home (REQ-024) with its quiet sign-in afterline — one
 * predictable landing place, deliberately not preserving the deep link.
 */
const SignedOut = () => {
    const { pathname } = useLocation()
    if (pathname !== paths.dashboard) {
        return <Navigate to={paths.dashboard} replace />
    }
    // The visitor's Home is the one public page that lives behind the
    // teacher gate — it shares the root path with the dashboard — so it is
    // counted here rather than in the router (REQ-058).
    return (
        <>
            <CountPageVisit page="home" />
            <HomeLanding />
        </>
    )
}

/**
 * Wraps a teacher-only route: signed in (or auth-less mode) renders the page,
 * signed out bounces to the dashboard's sign-in ask. Public routes never use
 * this — the Offerings and Contact pages stay reachable without an account
 * (REQ-006/007).
 */
export const RequireTeacher = ({ children }: { children: ReactNode }) => {
    if (!isAuthConfigured()) {
        return <>{children}</>
    }
    return (
        <>
            <AuthenticatedTemplate>{children}</AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <SignedOut />
            </UnauthenticatedTemplate>
        </>
    )
}
