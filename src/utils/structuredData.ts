/**
 * LocalBusiness structured data (REQ-043).
 *
 * One JSON-LD block describing the tutoring business, built from the SAME
 * published content the pages render — the never-invent rule applies to
 * markup as much as to copy: a field the owner has not published is left
 * out entirely rather than guessed at. Nothing here is hardcoded except
 * the schema.org vocabulary itself.
 */

import type { SiteContent } from '../data/siteContent'
import type { Contact } from '../data/contact'
import type { Testimonial } from '../data/students'
import { recommendationRoles } from '../data/students'

/** What the star chips claim, computed once so markup cannot drift from
    the visible number. Recommendations (Professional/Personal) carry no
    rating, so they are excluded from both the average and the count. */
export type ReviewSummary = { count: number; average: number }

export const familyReviewSummary = (
    testimonials: Testimonial[]
): ReviewSummary => {
    const family = testimonials.filter(
        (testimonial) => !recommendationRoles.includes(testimonial.role)
    )
    const count = family.length
    const average = count
        ? Math.round(
              (family.reduce(
                  (sum, testimonial) => sum + (testimonial.rating ?? 0),
                  0
              ) /
                  count) *
                  10
          ) / 10
        : 0
    return { count, average }
}

/** The published from-rates as a schema.org priceRange, e.g. "£20-£30".
    No rates published means no claim. */
const priceRangeOf = (content: SiteContent): string | undefined => {
    const rates = content.pricing.rates
        .map((rate) => rate.fromPerHour)
        .filter((rate) => rate > 0)
    if (!rates.length) {
        return undefined
    }
    const low = Math.min(...rates)
    const high = Math.max(...rates)
    return low === high ? `£${low}` : `£${low}-£${high}`
}

export type LocalBusinessJsonLd = Record<string, unknown>

/**
 * Builds the LocalBusiness block, or `undefined` when there is not enough
 * published content to describe the business honestly (no site name).
 *
 * `origin` is the site's own origin — absolute URLs are required, and the
 * deployed origin differs between dev and prod.
 */
export const buildLocalBusinessJsonLd = ({
    content,
    testimonials,
    contact,
    origin,
}: {
    content: SiteContent
    testimonials: Testimonial[]
    contact: Contact
    origin: string
}): LocalBusinessJsonLd | undefined => {
    const name = content.siteName.trim()
    if (!name) {
        return undefined
    }

    const subjects = content.subjects
        .map((subject) => subject.name.trim())
        .filter((subject) => subject.length > 0)
    const description = content.hero.subhead.trim()
    const priceRange = priceRangeOf(content)
    const area = content.areaServed.trim()
    const { count, average } = familyReviewSummary(testimonials)

    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name,
        url: origin,
        // The app icon is a real hosted file; the teacher's portrait is a
        // data-URI, which crawlers cannot fetch.
        logo: `${origin}/icons/icon-512.png`,
        ...(description ? { description } : {}),
        ...(contact.email ? { email: contact.email } : {}),
        ...(contact.phone ? { telephone: contact.phone } : {}),
        ...(priceRange ? { priceRange } : {}),
        // A location is the owner's to disclose (they teach from home),
        // so both come from one published field or not at all. Google
        // wants an address on a LocalBusiness; locality alone is the
        // service-area shape - no street, no invention.
        ...(area
            ? {
                  areaServed: area,
                  address: {
                      '@type': 'PostalAddress',
                      addressLocality: area,
                  },
              }
            : {}),
        ...(subjects.length ? { knowsAbout: subjects } : {}),
        // Stars only when families have actually left them, and the value
        // is the one the pages display.
        ...(count > 0
            ? {
                  aggregateRating: {
                      '@type': 'AggregateRating',
                      ratingValue: average,
                      reviewCount: count,
                      bestRating: 5,
                      worstRating: 1,
                  },
              }
            : {}),
    }
}
