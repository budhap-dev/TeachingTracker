import { PageLoading } from '../components/PageLoading'
import { ReviewsView } from '../components/ReviewsView'
import { useAppDispatch, useAppSelector } from '../hooks'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { fetchSiteContentRequested, fetchTestimonialsRequested, submitTestimonialRequested } from '../store/store'
import { useEffect } from 'react'

/**
 * Public page — approved reviews plus a submit form. Loads its own data on
 * mount: testimonials aren't part of the app's auth-gated boot fetches, and a
 * signed-out visitor must still see them.
 */
export const ReviewsRoute = () => {
    const dispatch = useAppDispatch()
    useDocumentMeta(
        'Reviews from families — AbhiTutor',
        'What parents and students say about tutoring with AbhiTutor — real reviews, checked before they appear. Share your own experience too.'
    )
    const testimonials = useAppSelector(
        (state) => state.students.testimonials
    )
    const loading = useAppSelector(
        (state) => state.students.testimonialsLoading
    )
    const saving = useAppSelector(
        (state) => state.students.savingTestimonial
    )
    // The published subjects drive the picker (owner report, 2026-08-10).
    const content = useAppSelector((state) => state.students.siteContent)
    useEffect(() => {
        dispatch(fetchTestimonialsRequested())
        dispatch(fetchSiteContentRequested())
    }, [dispatch])

    if (loading) {
        return <PageLoading />
    }
    const subjectChoices = content.subjects.map((subject) => subject.name)
    return (
        <ReviewsView
            testimonials={testimonials}
            saving={saving}
            {...(subjectChoices.length ? { subjectChoices } : {})}
            onSubmit={(input) => dispatch(submitTestimonialRequested(input))}
        />
    )
}

/** Teacher-only moderation queue for submitted reviews. Loads on mount. */
