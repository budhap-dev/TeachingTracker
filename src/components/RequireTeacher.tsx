import type { ReactNode } from 'react'
import {
    AuthenticatedTemplate,
    UnauthenticatedTemplate,
} from '@azure/msal-react'
import { isAuthConfigured } from '../auth/msal'
import { SignInView } from './SignInView'

/**
 * Wraps a teacher-only route: signed in (or auth-less mode) renders the page,
 * signed out renders the sign-in screen. Public routes never use this — the
 * Offerings and Contact pages stay reachable without an account (REQ-006/007).
 */
export const RequireTeacher = ({ children }: { children: ReactNode }) => {
    if (!isAuthConfigured()) {
        return <>{children}</>
    }
    return (
        <>
            <AuthenticatedTemplate>{children}</AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <SignInView />
            </UnauthenticatedTemplate>
        </>
    )
}
