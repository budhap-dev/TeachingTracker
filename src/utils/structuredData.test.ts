import { describe, expect, it } from 'vitest'
import {
    buildLocalBusinessJsonLd,
    familyReviewSummary,
} from './structuredData'
import { defaultSiteContent } from '../data/siteContent'
import type { Testimonial } from '../data/students'

const review = (
    id: number,
    rating: number,
    role: Testimonial['role'] = 'Parent'
): Testimonial => ({
    id,
    authorName: `Parent ${id}`,
    role,
    rating,
    quote: `Quote ${id}.`,
    status: 'Approved',
    submittedOn: '2026-05-01',
})

const build = (overrides: Partial<Parameters<typeof buildLocalBusinessJsonLd>[0]> = {}) =>
    buildLocalBusinessJsonLd({
        content: defaultSiteContent,
        testimonials: [],
        contact: {},
        origin: 'https://abhitutor.co.uk',
        ...overrides,
    })

describe('familyReviewSummary', () => {
    it('averages family reviews to one decimal, ignoring recommendations', () => {
        expect(
            familyReviewSummary([
                review(1, 5),
                review(2, 4),
                // Recommendations carry no stars — they must not dilute
                // the average nor inflate the count.
                { ...review(3, 0, 'Professional'), rating: undefined },
            ])
        ).toEqual({ count: 2, average: 4.5 })
    })

    it('reports nothing when no family has reviewed', () => {
        expect(familyReviewSummary([])).toEqual({ count: 0, average: 0 })
    })
})

describe('buildLocalBusinessJsonLd', () => {
    it('describes the business from the published document', () => {
        const data = build()

        expect(data).toMatchObject({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'AbhiTutor',
            url: 'https://abhitutor.co.uk',
            logo: 'https://abhitutor.co.uk/icons/icon-512.png',
            description: defaultSiteContent.hero.subhead,
        })
        // Subjects are the teacher's own published list.
        expect(data?.knowsAbout).toContain('Mathematics')
    })

    it('claims stars only when families have left them, matching the page', () => {
        expect(build().aggregateRating).toBeUndefined()

        const rated = build({ testimonials: [review(1, 5), review(2, 4)] })
        expect(rated?.aggregateRating).toEqual({
            '@type': 'AggregateRating',
            ratingValue: 4.5,
            reviewCount: 2,
            bestRating: 5,
            worstRating: 1,
        })
    })

    it('publishes only the contact channels the teacher has published', () => {
        expect(build().email).toBeUndefined()
        expect(build().telephone).toBeUndefined()

        const reachable = build({
            contact: { email: 'hello@abhitutor.co.uk', phone: '07000 000000' },
        })
        expect(reachable?.email).toBe('hello@abhitutor.co.uk')
        expect(reachable?.telephone).toBe('07000 000000')
    })

    it('derives the price range from the published rates, or omits it', () => {
        const priced = build({
            content: {
                ...defaultSiteContent,
                pricing: {
                    ...defaultSiteContent.pricing,
                    rates: [
                        { label: 'GCSE', fromPerHour: 20 },
                        { label: 'A-level', fromPerHour: 30 },
                    ],
                },
            },
        })
        expect(priced?.priceRange).toBe('£20-£30')

        // Pricing not published: no claim at all.
        const unpriced = build({
            content: {
                ...defaultSiteContent,
                pricing: { rates: [], factors: [], note: '' },
            },
        })
        expect(unpriced?.priceRange).toBeUndefined()
    })

    it('publishes the area served, and an address, only once given', () => {
        // A location is the owner's to disclose: nothing is inferred.
        expect(build().areaServed).toBeUndefined()
        expect(build().address).toBeUndefined()

        const local = build({
            content: { ...defaultSiteContent, areaServed: ' Leeds ' },
        })
        expect(local?.areaServed).toBe('Leeds')
        expect(local?.address).toEqual({
            '@type': 'PostalAddress',
            addressLocality: 'Leeds',
        })
    })

    it('stays silent when there is no site name to describe', () => {
        expect(
            build({ content: { ...defaultSiteContent, siteName: '  ' } })
        ).toBeUndefined()
    })
})
