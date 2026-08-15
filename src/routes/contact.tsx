import { isAuthConfigured } from '../auth/msal'
import { ContactView } from '../components/ContactView'
import { PageLoading } from '../components/PageLoading'
import { useAppDispatch, useAppSelector } from '../hooks'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { fetchContactRequested, updateContactRequested } from '../store/store'
import { useIsAuthenticated } from '@azure/msal-react'
import { useEffect } from 'react'

/**
 * Public page — reads contact details from the store, never student data.
 * Loads on mount (like the Reviews routes): the details are public and a
 * signed-out visitor must still see them. `canEdit` turns on the inline
 * teacher editor.
 */
const ContactRouteInner = ({ canEdit }: { canEdit: boolean }) => {
    const dispatch = useAppDispatch()
    useDocumentMeta(
        'Contact me — AbhiTutor',
        'Ask about tutoring availability, subjects or a free first assessment — by email, phone or WhatsApp. I will reply or contact you as soon as possible.'
    )
    const contact = useAppSelector((state) => state.students.contact)
    const loading = useAppSelector((state) => state.students.contactLoading)
    const saving = useAppSelector((state) => state.students.savingContact)
    useEffect(() => {
        dispatch(fetchContactRequested())
    }, [dispatch])

    if (loading) {
        return <PageLoading />
    }
    return (
        <ContactView
            contact={contact}
            canEdit={canEdit}
            saving={saving}
            onSave={(input) => dispatch(updateContactRequested(input))}
        />
    )
}

// The auth hook only runs beneath an MsalProvider, so it lives in its own
// component chosen by isAuthConfigured — the same split the Sidebar uses. With
// auth switched off (local dev), every visitor is treated as the teacher.
const ContactRouteSignedAware = () => (
    <ContactRouteInner canEdit={useIsAuthenticated()} />
)

export const ContactRoute = () =>
    isAuthConfigured() ? (
        <ContactRouteSignedAware />
    ) : (
        <ContactRouteInner canEdit />
    )
