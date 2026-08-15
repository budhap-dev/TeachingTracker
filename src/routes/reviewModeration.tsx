import { PageLoading } from '../components/PageLoading'
import { ReviewModerationView } from '../components/ReviewModerationView'
import { useAppDispatch, useAppSelector } from '../hooks'
import { deleteTestimonialRequested, fetchPendingTestimonialsRequested, fetchTestimonialsRequested, moderateTestimonialRequested } from '../store/store'
import { useEffect } from 'react'

export const ReviewModerationRoute = () => {
    const dispatch = useAppDispatch()
    const pending = useAppSelector(
        (state) => state.students.pendingTestimonials
    )
    // The published (approved) reviews too, so the teacher can take one down
    // after approval — deleting removes it from the public page as well.
    const published = useAppSelector((state) => state.students.testimonials)
    const loading = useAppSelector(
        (state) => state.students.pendingTestimonialsLoading
    )
    useEffect(() => {
        dispatch(fetchPendingTestimonialsRequested())
        dispatch(fetchTestimonialsRequested())
    }, [dispatch])

    if (loading) {
        return <PageLoading />
    }
    return (
        <ReviewModerationView
            pending={pending}
            published={published}
            onApprove={(id) =>
                dispatch(
                    moderateTestimonialRequested({ id, status: 'Approved' })
                )
            }
            onReject={(id) =>
                dispatch(
                    moderateTestimonialRequested({ id, status: 'Rejected' })
                )
            }
            onDelete={(id) => dispatch(deleteTestimonialRequested(id))}
        />
    )
}

/** Public enquiry form (REQ-018) — no auth, mirrors the Reviews submit. */
