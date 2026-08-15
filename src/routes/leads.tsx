import { LeadsView } from '../components/LeadsView'
import { PageLoading } from '../components/PageLoading'
import { useAppDispatch, useAppSelector } from '../hooks'
import { paths } from '../paths'
import { deleteLeadRequested, fetchLeadsRequested, updateLeadStatusRequested } from '../store/store'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const LeadsRoute = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const leads = useAppSelector((state) => state.students.leads)
    const loading = useAppSelector((state) => state.students.leadsLoading)
    useEffect(() => {
        dispatch(fetchLeadsRequested())
    }, [dispatch])

    if (loading) {
        return <PageLoading />
    }
    return (
        <LeadsView
            leads={leads}
            onSetStatus={(id, status) =>
                dispatch(updateLeadStatusRequested({ id, status }))
            }
            onDelete={(id) => dispatch(deleteLeadRequested(id))}
            onConvert={(lead) => {
                dispatch(
                    updateLeadStatusRequested({
                        id: lead.id,
                        status: 'Converted',
                    })
                )
                navigate(paths.students, { state: { prefillLead: lead } })
            }}
        />
    )
}

/** Teacher-only route element: gated by sign-in when auth is configured. */
