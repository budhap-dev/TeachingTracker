import type { Testimonial, TestimonialRole } from '../data/students'
import { apiRequest } from './client'

/**
 * What a family submits from the public Reviews page. `website` is a honeypot —
 * a hidden field real people leave blank; a filled one marks a bot, which the
 * API silently drops.
 */
export type TestimonialInput = {
    authorName: string
    role: TestimonialRole
    subject?: string
    year?: string
    /** Family reviews only — a recommendation submits none. */
    rating?: number
    quote: string
    website?: string
}

/** GET /testimonials — public: Approved reviews only, newest first. */
export const fetchApprovedTestimonials = (): Promise<Testimonial[]> =>
    apiRequest<Testimonial[]>('/testimonials')

/** GET /testimonials/pending — teacher: the moderation queue. */
export const fetchPendingTestimonials = (): Promise<Testimonial[]> =>
    apiRequest<Testimonial[]>('/testimonials/pending')

/** POST /testimonials — public: submit a review (lands as Pending). */
export const submitTestimonial = (input: TestimonialInput): Promise<void> =>
    apiRequest<{ ok: boolean }>('/testimonials', {
        method: 'POST',
        body: input,
    }).then(() => undefined)

/** PUT /testimonials/{id} — teacher: approve or reject; the review comes back. */
export const setTestimonialStatus = (
    id: number,
    status: 'Approved' | 'Rejected'
): Promise<Testimonial> =>
    apiRequest<Testimonial>(`/testimonials/${id}`, {
        method: 'PUT',
        body: { status },
    })

/**
 * PUT /testimonials/{id} — teacher: choose this review for Home, or take it
 * off (REQ-059). The updated review comes back; a fourth pick is refused by
 * the API with a message the moderation screen shows as-is.
 */
export const setTestimonialFeatured = (
    id: number,
    featured: boolean
): Promise<Testimonial> =>
    apiRequest<Testimonial>(`/testimonials/${id}`, {
        method: 'PUT',
        body: { featured },
    })

/** DELETE /testimonials/{id} — teacher: remove a review; the id comes back. */
export const deleteTestimonial = async (id: number): Promise<number> => {
    const { id: removed } = await apiRequest<{ id: number }>(
        `/testimonials/${id}`,
        { method: 'DELETE' }
    )
    return removed
}
