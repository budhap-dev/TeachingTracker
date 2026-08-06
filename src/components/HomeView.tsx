import { useEffect } from 'react'
import { Button, Rating } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
    fetchSiteContentRequested,
    fetchTestimonialsRequested,
} from '../store/store'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { signIn } from '../auth/msal'
import { BrandBadge } from './BrandBadge'
import { subjectIcon } from '../utils/subjectIcons'

import { paths } from '../paths'
import type { Testimonial } from '../data/students'

import type { SiteContent } from '../data/siteContent'

type HomeViewProps = {
    /** Approved reviews for the proof strip; the view shows up to three. */
    testimonials: Testimonial[]
    /** The teacher-published document (REQ-008) feeding the hero + journey. */
    content: SiteContent
}

/** A friendly glyph for each journey step, in order (mirrors Offerings). */
const journeyIcons = ['💬', '📝', '🎯', '📅']

/**
 * The public Home landing (REQ-024): what a signed-out visitor sees at the
 * site root — the pitch, proof, and a route onward — instead of a bare
 * sign-in wall. The teacher's dashboard stays behind sign-in at the same
 * path; teacher sign-in is a quiet afterline here, not the headline.
 */
export const HomeView = ({ testimonials, content }: HomeViewProps) => {
    useDocumentMeta(
        'AbhiTutor — Where confidence takes off.',
        'Personal tutoring in maths and the sciences for Years 7–13, online or in person. Matched to your exam board, planned around the school week.'
    )
    const { hero, journey } = content
    const lead = testimonials[0]
    const experienceYears = hero.experienceYears ?? 0
    // The rating chip averages the approved reviews already on this page —
    // real, permissioned numbers (REQ-027), no extra endpoint.
    const reviewCount = testimonials.length
    const averageRating = reviewCount
        ? Math.round(
              (testimonials.reduce(
                  (sum, testimonial) => sum + testimonial.rating,
                  0
              ) /
                  reviewCount) *
                  10
          ) / 10
        : 0
    // The levels and boards chips: distinct values across the published
    // subjects, in first-seen order — "KS3 · GCSE · A-level", "AQA ·
    // Edexcel · OCR". Both are the teacher's own content, never hardcoded.
    const levels = Array.from(
        new Set(
            content.subjects.flatMap((subject) => subject.keyStages ?? [])
        )
    ).join(' · ')
    // The price chip anchors on the cheapest published rate (REQ-022).
    const fromPrice = content.pricing.rates.length
        ? Math.min(...content.pricing.rates.map((rate) => rate.fromPerHour))
        : 0
    const boards = Array.from(
        new Set(
            content.subjects.flatMap((subject) => subject.examBoards ?? [])
        )
    ).join(' · ')

    return (
        <section className="content-stack home-view">
            {/* D1 "the Brand Band" (owner pick, 2026-08-04): the hero is a
                sweep of the brand gradient — badge, promise, ONE call to
                action and the trust chips all inside the first viewport.
                The site name is deliberately absent here: the topbar lockup
                already says it, and saying it twice was the old page's
                fault. */}
            <div className="home-hero-band">
                <div className="home-band-lead">
                    <BrandBadge size={74} />
                    <div className="home-band-copy">
                        <h3 className="home-band-headline">{hero.headline}</h3>
                        <p className="home-band-subhead">{hero.subhead}</p>
                        {hero.availability && (
                            <p className="home-band-availability">
                                {hero.availability}
                            </p>
                        )}
                    </div>
                </div>
                <div className="home-band-actions">
                    <Button
                        className="home-band-cta"
                        component={Link}
                        to={paths.enquire}
                    >
                        Request a free assessment
                    </Button>
                    <Link className="home-band-more" to={paths.offerings}>
                        Explore subjects →
                    </Link>
                </div>
                {(reviewCount > 0 ||
                    experienceYears > 0 ||
                    levels ||
                    boards) && (
                    <ul
                        className="home-band-chips"
                        aria-label="Teaching record so far"
                    >
                        {reviewCount > 0 && (
                            <li>
                                ★ {averageRating} · {reviewCount}{' '}
                                {reviewCount === 1 ? 'family' : 'families'}
                            </li>
                        )}
                        {experienceYears > 0 && (
                            <li>{experienceYears}+ years teaching</li>
                        )}
                        {levels && <li>{levels}</li>}
                        {boards && <li>{boards}</li>}
                        {fromPrice > 0 && <li>From £{fromPrice}/hr</li>}
                    </ul>
                )}
            </div>

            {/* What we teach, without a click: the published subjects. */}
            {content.subjects.length > 0 && (
                <div
                    className="home-subject-chips"
                    aria-label="Subjects taught"
                >
                    {content.subjects.map((subject) => {
                        const Icon = subjectIcon(subject.name)
                        return (
                            <Link
                                key={subject.name}
                                className="home-subject-chip"
                                to={paths.offerings}
                            >
                                <Icon fontSize="small" aria-hidden />
                                {subject.name}
                            </Link>
                        )
                    })}
                </div>
            )}

            {/* Proof with a face + the journey at a glance, side by side.
                The review card leads with the whole record — hero rating,
                star row, the live distribution — then one voice from it. */}
            <div className="home-proof-row">
                {lead && (
                    <figure className="card home-quote">
                        <div className="home-rating-summary">
                            <span className="home-rating-big">
                                {averageRating.toFixed(1)}
                            </span>
                            <div>
                                <Rating
                                    value={averageRating}
                                    precision={0.1}
                                    readOnly
                                    size="small"
                                />
                                <span className="home-rating-count">
                                    from {reviewCount} family{' '}
                                    {reviewCount === 1 ? 'review' : 'reviews'}
                                </span>
                            </div>
                        </div>
                        <ul
                            className="home-rating-bars"
                            aria-label="Rating breakdown"
                        >
                            {[5, 4, 3, 2, 1].map((stars) => {
                                const count = testimonials.filter(
                                    (t) => t.rating === stars
                                ).length
                                return (
                                    <li key={stars}>
                                        <span>{stars}★</span>
                                        <span className="home-rating-track">
                                            <span
                                                className="home-rating-fill"
                                                style={{
                                                    width: `${(count / reviewCount) * 100}%`,
                                                }}
                                            />
                                        </span>
                                        <span>{count}</span>
                                    </li>
                                )
                            })}
                        </ul>
                        <blockquote>{lead.quote}</blockquote>
                        <figcaption>
                            <strong>{lead.authorName}</strong>
                            <span>{lead.role}</span>
                            <Button
                                variant="text"
                                component={Link}
                                to={paths.reviews}
                            >
                                Read all reviews
                            </Button>
                        </figcaption>
                    </figure>
                )}
                <div className="card home-journey-mini">
                    <h4 className="offerings-heading">How it works</h4>
                    <ol>
                        {journey.map((step, index) => (
                            <li key={step.title}>
                                <span className="home-journey-icon" aria-hidden>
                                    {journeyIcons[index % journeyIcons.length]}
                                </span>
                                <div>
                                    <strong>{step.title}</strong>
                                    <p>{step.detail}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            <p className="home-teacher-line">
                Are you the teacher?{' '}
                <Button
                    size="small"
                    variant="text"
                    onClick={() => void signIn()}
                >
                    Sign in with Microsoft
                </Button>
            </p>
        </section>
    )
}

/**
 * The connected Home: loads the approved reviews itself — a visitor's first
 * request lands here, before any teacher boot fetches — and never blocks on
 * them (the hero renders at once; proof fills in).
 */
export const HomeLanding = () => {
    const dispatch = useAppDispatch()
    const testimonials = useAppSelector(
        (state) => state.students.testimonials
    )
    const content = useAppSelector((state) => state.students.siteContent)
    useEffect(() => {
        dispatch(fetchTestimonialsRequested())
        dispatch(fetchSiteContentRequested())
    }, [dispatch])
    return <HomeView testimonials={testimonials} content={content} />
}
