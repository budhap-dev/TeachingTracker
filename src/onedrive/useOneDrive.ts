import { useEffect, useState } from 'react'
import { isOneDriveConnected, isOneDriveEnabled } from '../auth/msal'

export type OneDriveStatus = 'off' | 'checking' | 'connected' | 'disconnected'

/**
 * Whether files on classes can be used here (REQ-063): off when the build
 * has the feature switched off, otherwise whether a personal account for
 * OneDrive is in the sign-in cache.
 */
export const useOneDriveStatus = (): OneDriveStatus => {
    const enabled = isOneDriveEnabled()
    const [connected, setConnected] = useState<boolean | null>(null)

    useEffect(() => {
        if (!enabled) {
            return
        }
        let live = true
        void isOneDriveConnected().then((value) => {
            if (live) setConnected(value)
        })
        return () => {
            live = false
        }
    }, [enabled])

    if (!enabled) return 'off'
    if (connected === null) return 'checking'
    return connected ? 'connected' : 'disconnected'
}
