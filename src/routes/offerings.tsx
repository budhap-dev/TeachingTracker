import { OfferingsView } from '../components/OfferingsView'
import { useAppDispatch, useAppSelector } from '../hooks'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { paths } from '../paths'
import { fetchSiteContentRequested } from '../store/store'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/** All application routes. Rendered inside the router by {@link App}. */
/** Public page — reads site copy, never student data. */
export const OfferingsRoute = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    // The teacher-published document (REQ-008): the bundled fallback renders
    // immediately; the fetched copy swaps in when it lands.
    const content = useAppSelector((state) => state.students.siteContent)
    useEffect(() => {
        dispatch(fetchSiteContentRequested())
    }, [dispatch])
    useDocumentMeta(
        'Subjects & how lessons run — AbhiTutor',
        'Maths, physics, chemistry and biology from KS3 to GCSE and A-level, matched to your exam board — online or in person. See how lessons run, from enquiry to weekly sessions.'
    )
    return (
        <OfferingsView
            content={content}
            // The assessment CTA starts a real enquiry (REQ-018).
            onBookAssessment={() => navigate(paths.enquire)}
        />
    )
}
