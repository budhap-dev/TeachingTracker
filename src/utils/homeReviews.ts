import type { Testimonial } from '../data/students'

/**
 * How many reviews Home shows, and the cap the teacher picks against — five
 * (owner call, 2026-08-16; it was three). Desktop lays them out three to a row
 * with the remainder centred; the phone rail simply gains dots.
 */
export const HOME_REVIEW_COUNT = 5

/**
 * Quote-length buckets (REQ-059). The submit form caps a quote at 600
 * characters and sets no floor, so three cards in a row can differ by a factor
 * of fifteen. Every card is one fixed height — which is what stops the phone
 * rail resizing under a swipe — and the type is sized to the quote so a short
 * review fills its card instead of floating in white space.
 *
 * Three buckets, deliberately, rather than a size computed per character: a
 * continuous scale would re-set the whole row every time a review was swapped
 * for one a few words longer.
 */
const SHORT_QUOTE = 80
const LONG_QUOTE = 300

export type QuoteLength = 'short' | 'mid' | 'long'

export const quoteLength = (quote: string): QuoteLength => {
    if (quote.length <= SHORT_QUOTE) {
        return 'short'
    }
    return quote.length <= LONG_QUOTE ? 'mid' : 'long'
}

/**
 * Whether the card will run out of room for this quote, measured rather than
 * guessed: a card gives the quote about 100px, which is four lines of the
 * middle size on the narrowest phone card — roughly 130 characters.
 *
 * It is deliberately NOT the same line as `long`. A 200-character quote sets
 * at body size and still overflows, and the first build only offered a way
 * through to reviews over 300 — so everything between the two was cut off
 * mid-sentence with no way to read the rest.
 */
const CLIPPED_AT = 130

export const isClipped = (quote: string): boolean => quote.length > CLIPPED_AT

/**
 * The reviews the Home strip shows: the teacher's picks (REQ-059), or the
 * newest approved ones until they have made any. Nothing is chosen on day one,
 * so the fallback is what keeps the strip useful before the teacher ever
 * visits moderation — the same way the bio section ships empty and safe.
 */
export const chooseHomeReviews = (
    testimonials: Testimonial[]
): Testimonial[] => {
    const featured = testimonials.filter((testimonial) => testimonial.featured)
    return (featured.length > 0 ? featured : testimonials).slice(
        0,
        HOME_REVIEW_COUNT
    )
}
