import { EnquireView } from '../components/EnquireView'
import { useAppDispatch, useAppSelector } from '../hooks'
import { fetchSiteContentRequested, submitLeadRequested } from '../store/store'
import { useEffect } from 'react'

export const EnquireRoute = () => {
    const dispatch = useAppDispatch()
    const saving = useAppSelector((state) => state.students.savingLead)
    const submitted = useAppSelector((state) => state.students.leadSubmitted)
    // The published subjects drive the picker (owner report, 2026-08-10).
    const content = useAppSelector((state) => state.students.siteContent)
    useEffect(() => {
        dispatch(fetchSiteContentRequested())
    }, [dispatch])
    const subjectChoices = content.subjects.map((subject) => subject.name)
    return (
        <EnquireView
            saving={saving}
            submitted={submitted}
            {...(subjectChoices.length ? { subjectChoices } : {})}
            onSubmit={(input) => dispatch(submitLeadRequested(input))}
        />
    )
}

/**
 * Teacher's enquiries inbox (REQ-019). Loads on mount; converting a lead
 * marks it Converted and opens the add-student form pre-filled via router
 * state, so the details never need retyping.
 */
