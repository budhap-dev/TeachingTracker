import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
    AuthenticatedTemplate,
    UnauthenticatedTemplate,
} from '@azure/msal-react'
import { isAuthConfigured } from '../auth/msal'
import { paths } from '../paths'
import { SignInView } from './SignInView'

/**
 * Signed out, every teacher route bounces to the dashboard, which is where
 * the sign-in ask lives — one predictable landing place, deliberately not
 * preserving the requested deep link.
 */
const SignedOut = () => {
    const { pathname } = useLocation()
    if (pathname !== paths.dashboard) {
        return <Navigate to={paths.dashboard} replace />
    }
    return <SignInView />
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
