import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined'
import { useIsOffline } from '../hooks/useIsOffline'

/**
 * The offline line (REQ-044): with the app installed and no signal, the
 * service worker serves the shell — this says why the page looks quiet
 * instead of leaving someone to guess.
 *
 * In the content column rather than pinned: the phone screen already has a
 * sticky brand band above and a tab bar below, and a third fixed strip would
 * leave the page reading through a letterbox.
 */
export const OfflineNotice = () => {
    const offline = useIsOffline()
    if (!offline) {
        return null
    }
    return (
        <p className="offline-notice" role="status">
            <CloudOffOutlinedIcon fontSize="small" aria-hidden />
            You’re offline — this is the last version saved to your device.
            Anything you send needs a connection.
        </p>
    )
}
