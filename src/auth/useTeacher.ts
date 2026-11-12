import { InteractionStatus, type AccountInfo } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'
import { isTeacherAccount } from './msal'

/**
 * The signed-in teacher's account — the tenant one — or null.
 *
 * msal-react's own `useIsAuthenticated` and `AuthenticatedTemplate` count
 * *any* cached account. Once the teacher connects OneDrive (REQ-063) the
 * cache also holds their personal account, which must never pass for the
 * teacher: so every "who is signed in" question in the app asks here.
 */
export const useTeacherAccount = (): AccountInfo | null =>
    useMsal().accounts.find(isTeacherAccount) ?? null

/** True when the teacher (tenant account) is signed in. */
export const useIsTeacher = (): boolean => useTeacherAccount() !== null

/**
 * Whether the redirect handshake has settled enough to judge signed-in or
 * out — the same window msal-react's templates wait for.
 */
export const useAuthSettled = (): boolean => {
    const { inProgress } = useMsal()
    return (
        inProgress !== InteractionStatus.Startup &&
        inProgress !== InteractionStatus.HandleRedirect
    )
}
