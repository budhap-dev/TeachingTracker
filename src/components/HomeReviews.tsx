import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Rating } from '@mui/material'
import type { Testimonial } from '../data/students'
import { paths } from '../paths'
import { chooseHomeReviews, isClipped, quoteLength } from '../utils/homeReviews'

/** "Parent · Mathematics · Year 10", dropping whichever parts are absent. */
const attribution = (testimonial: Testimonial): string =>
    [
        testimonial.role,
        testimonial.subject,
        testimonial.year ? `Year ${testimonial.year}` : undefined,
    ]
        .filter(Boolean)
        .join(' · ')

type HomeReviewsProps = {
    /** Approved reviews, newest first — the public list. */
    testimonials: Testimonial[]
}

/**
 * Proof directly under the hero's call to action (REQ-059) — three reviews the
 * teacher chose, where the decision is made rather than a page away.
 *
 * On a phone the three become a swipeable rail with a dot per card (owner ask,
 * 2026-08-16) instead of a scrollbar: the dots say how many there are before
 * the visitor swipes, which a scrollbar only does once they already have. The
 * dots read the rail rather than driving it — the scroll position is the one
 * source of truth, so they can never point at a card that is not on screen,
 * however the visitor got there (swipe, dot, or keyboard).
 *
 * Still no timer and no autoplay: the only movement is the one the visitor
 * asked for, and its smoothness is a CSS scroll-behavior that reduced-motion
 * turns off.
 */
export const HomeReviews = ({ testimonials }: HomeReviewsProps) => {
    const rail = useRef<HTMLDivElement>(null)
    const [current, setCurrent] = useState(0)
    // Assume it scrolls until measurement says otherwise: three picks on a
    // wide screen all fit, and dots for a rail that cannot move are furniture.
    const [scrollable, setScrollable] = useState(true)
    const shown = chooseHomeReviews(testimonials)

    /**
     * The distance from one card to the next, gap included. Read from the
     * cards rather than assumed, because a desktop rail shows three of them to
     * a screen and a phone shows one — dividing by the rail's own width would
     * only ever be right on the phone.
     */
    const cardStep = (element: HTMLDivElement): number => {
        const [first, second] = element.children
        if (first && second) {
            return (
                (second as HTMLElement).offsetLeft -
                (first as HTMLElement).offsetLeft
            )
        }
        return element.clientWidth
    }

    /** Which card leads the rail now — rounded, so a half-drag back counts. */
    const trackScroll = () => {
        const element = rail.current
        // Both are 0 before layout (and under jsdom); dividing by either would
        // make the active dot NaN.
        if (!element || element.clientWidth === 0) {
            return
        }
        const step = cardStep(element)
        if (step > 0) {
            setCurrent(Math.round(element.scrollLeft / step))
        }
    }

    const goTo = (index: number) => {
        const element = rail.current
        if (!element) {
            return
        }
        // Assigning scrollLeft rather than calling scrollTo({behavior}) leaves
        // the animation to CSS, which is where the reduced-motion rule lives.
        element.scrollLeft = index * cardStep(element)
        // Read back what the rail actually did rather than assuming it obeyed:
        // the last cards cannot lead a rail that shows three at once, so their
        // dot would otherwise light up for a position the rail never reached.
        trackScroll()
    }

    // Whether there is anything to scroll to. Re-measured on resize, since a
    // window narrow enough to show one card scrolls when the same three cards
    // at full width do not.
    useEffect(() => {
        const element = rail.current
        const measure = () => {
            if (!element || element.clientWidth === 0) {
                return
            }
            setScrollable(element.scrollWidth > element.clientWidth + 1)
        }
        measure()
        if (!element || typeof ResizeObserver === 'undefined') {
            return
        }
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    }, [shown.length])

    if (shown.length === 0) {
        return null
    }
    return (
        <div className="card home-reviews-card">
            <div className="home-reviews-head">
                <h4 className="offerings-heading">What families say</h4>
                <Link className="home-reviews-all" to={paths.reviews}>
                    Read all reviews →
                </Link>
            </div>
            <div className="home-review-grid" ref={rail} onScroll={trackScroll}>
                {shown.map((testimonial) => {
                    const length = quoteLength(testimonial.quote)
                    const clipped = isClipped(testimonial.quote)
                    return (
                        <figure
                            key={testimonial.id}
                            className={[
                                'testimonial-card review home-review',
                                `is-${length}`,
                                clipped ? 'is-clipped' : '',
                            ]
                                .join(' ')
                                .trim()}
                        >
                            {/* A recommendation carries no star rating, so it
                                shows no stars rather than an empty row. */}
                            {testimonial.rating ? (
                                <Rating
                                    value={testimonial.rating}
                                    readOnly
                                    size="small"
                                />
                            ) : null}
                            <blockquote>{testimonial.quote}</blockquote>
                            {/* A quote the card cannot hold fades out rather
                                than stopping dead, and keeps a way through to
                                the whole of it — nothing a family wrote is
                                lost, only deferred. */}
                            {clipped && (
                                <Link
                                    className="home-review-more"
                                    to={`${paths.reviews}#review-${testimonial.id}`}
                                >
                                    Read this review →
                                </Link>
                            )}
                            <figcaption>
                                <strong>{testimonial.authorName}</strong>
                                <span>{attribution(testimonial)}</span>
                            </figcaption>
                        </figure>
                    )
                })}
            </div>
            {/* One dot per card, wherever the rail can actually move — with
                three picks on a wide screen it cannot, and dots would be
                pointing at nothing. Buttons, not decoration: a dot you can see
                is a dot a keyboard should reach. */}
            {shown.length > 1 && scrollable && (
                <div className="home-review-dots">
                    {shown.map((testimonial, index) => (
                        <button
                            key={testimonial.id}
                            type="button"
                            className={
                                index === current
                                    ? 'home-review-dot is-current'
                                    : 'home-review-dot'
                            }
                            aria-label={`Review ${index + 1} of ${shown.length}`}
                            aria-current={index === current}
                            onClick={() => goTo(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
