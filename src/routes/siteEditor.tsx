import { SiteEditorView } from '../components/SiteEditorView'
import { useAppDispatch, useAppSelector } from '../hooks'
import { fetchSiteContentRequested, publishSiteContentRequested } from '../store/store'
import { useEffect } from 'react'

/**
 * The teacher's site editor (REQ-008). Edits run against the published
 * document, so it is fetched on mount like the other self-loading routes;
 * the bundled fallback renders until it lands.
 */
export const SiteEditorRoute = () => {
    const dispatch = useAppDispatch()
    const content = useAppSelector((state) => state.students.siteContent)
    const publishing = useAppSelector(
        (state) => state.students.publishingSiteContent
    )
    useEffect(() => {
        dispatch(fetchSiteContentRequested())
    }, [dispatch])
    return (
        <SiteEditorView
            content={content}
            publishing={publishing}
            onPublish={(next) => dispatch(publishSiteContentRequested(next))}
        />
    )
}
