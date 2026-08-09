import { useEffect, useRef, useState } from 'react'
import { Button } from '@mui/material'
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
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import LaptopChromebookOutlinedIcon from '@mui/icons-material/LaptopChromebookOutlined'
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded'
import SelfImprovementRoundedIcon from '@mui/icons-material/SelfImprovementRounded'
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import StarOutlineRoundedIcon from '@mui/icons-material/StarOutlineRounded'

import { paths } from '../paths'
import type { Testimonial } from '../data/students'
import { recommendationRoles } from '../data/students'

import type { SiteContent } from '../data/siteContent'

type HomeViewProps = {
    /** Approved reviews for the proof strip; the view shows up to three. */
    testimonials: Testimonial[]
    /** The teacher-published document (REQ-008) feeding the hero + journey. */
    content: SiteContent
    /** True once the site-content fetch settled — numeric trust chips wait
        for it so bundled defaults never flash unpublished claims. */
    contentLoaded?: boolean
}

/** A highlight tile's glyph, matched by keyword — the curated set from
    REQ-038; a star stands in for anything unrecognised. */
const highlightIcon = (title: string) => {
    const lower = title.toLowerCase()
    if (lower.includes('schedul') || lower.includes('flexib')) {
        return CalendarMonthOutlinedIcon
    }
    if (lower.includes('communicat') || lower.includes('parent')) {
        return ForumOutlinedIcon
    }
    if (lower.includes('progress') || lower.includes('report')) {
        return InsightsOutlinedIcon
    }
    if (lower.includes('online')) {
        return LaptopChromebookOutlinedIcon
    }
    if (lower.includes('personalis') || lower.includes('personaliz')) {
        return TrackChangesRoundedIcon
    }
    if (lower.includes('confidence')) {
        return SelfImprovementRoundedIcon
    }
    if (lower.includes('exam') || lower.includes('assessment')) {
        return HistoryEduOutlinedIcon
    }
    if (lower.includes('result')) {
        return EmojiEventsRoundedIcon
    }
    return StarOutlineRoundedIcon
}

/** A friendly glyph for each journey step, in order (mirrors Offerings). */
const journeyIcons = ['💬', '📝', '🎯', '📅']

/**
 * The public Home landing (REQ-024): what a signed-out visitor sees at the
 * site root — the pitch, proof, and a route onward — instead of a bare
 * sign-in wall. The teacher's dashboard stays behind sign-in at the same
 * path; teacher sign-in is a quiet afterline here, not the headline.
 */
export const HomeView = ({
    testimonials,
    content,
    contentLoaded = true,
}: HomeViewProps) => {
    useDocumentMeta(
        'AbhiTutor — Where confidence takes off.',
        'Personal tutoring in maths and the sciences for Years 7–13, online or in person. Matched to your exam board, planned around the school week.'
    )
    const { hero, journey } = content
    // The teacher door (owner ask, 2026-08-06): the sign-in afterline is
    // hidden from visitors and revealed by five quick taps on the hero
    // badge — a UX tidy-up, not security; sign-in stays Microsoft-gated.
    // The reveal holds for the rest of the browser session.
    const [teacherDoor, setTeacherDoor] = useState(
        () => sessionStorage.getItem('teacher-door') === 'open'
    )
    const badgeTaps = useRef({ count: 0, last: 0 })
    const handleBadgeTap = () => {
        const now = Date.now()
        const taps = badgeTaps.current
        // A slow tap restarts the count — accidental pokes never add up.
        taps.count = now - taps.last > 2000 ? 1 : taps.count + 1
        taps.last = now
        if (taps.count >= 5) {
            setTeacherDoor(true)
            sessionStorage.setItem('teacher-door', 'open')
        }
    }
    // Recommendations (Professional/Personal) have no star rating — the
    // rating maths and the "N families" claim use family reviews only, so
    // the numbers stay honest.
    const familyReviews = testimonials.filter(
        (testimonial) => !recommendationRoles.includes(testimonial.role)
    )
    const experienceYears = contentLoaded ? (hero.experienceYears ?? 0) : 0
    const reviewCount = familyReviews.length
    const averageRating = reviewCount
        ? Math.round(
              (familyReviews.reduce(
                  (sum, testimonial) => sum + (testimonial.rating ?? 0),
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
    const fromPrice =
        contentLoaded && content.pricing.rates.length
            ? Math.min(
                  ...content.pricing.rates.map((rate) => rate.fromPerHour)
              )
            : 0
    const boards = Array.from(
        new Set(
            content.subjects.flatMap((subject) => subject.examBoards ?? [])
        )
    ).join(' · ')

    // The selling points that close (REQ-038): owner-approved highlight
    // tiles in their own card — the in-card rating record and the parent
    // quote both retired; the trust chips' ★ average carries the number
    // (owner calls, 2026-08-06). "Proven results" carries its evidence —
    // it links to the reviews.
    const highlightGrid =
        contentLoaded && content.highlights.length > 0 ? (
            <ul className="home-highlights" aria-label="Why AbhiTutor">
                {content.highlights.map((title) => {
                    const Icon = highlightIcon(title)
                    const provesResults = title
                        .toLowerCase()
                        .includes('result')
                    return (
                        <li key={title}>
                            {provesResults ? (
                                <Link
                                    className="home-highlight-tile"
                                    to={paths.reviews}
                                >
                                    <Icon fontSize="small" aria-hidden />
                                    {title}
                                </Link>
                            ) : (
                                <span className="home-highlight-tile">
                                    <Icon fontSize="small" aria-hidden />
                                    {title}
                                </span>
                            )}
                        </li>
                    )
                })}
            </ul>
        ) : null

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
                    {/* display:contents — the wrapper counts taps without
                        touching the band's flex layout. */}
                    <span
                        className="home-badge-tap"
                        onClick={handleBadgeTap}
                    >
                        <BrandBadge size={74} />
                    </span>
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
                        {fromPrice > 0 && <li>From £{fromPrice}/session</li>}
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

            {/* The reasons + the journey at a glance, side by side. Parent
                quotes retired from the hero (owner call, 2026-08-06) — the
                trust chips' ★ average and the Reviews page carry the
                proof. */}
            <div className="home-proof-row">
                {highlightGrid && (
                    <div className="card home-highlights-card">
                        <h4 className="offerings-heading">Why AbhiTutor</h4>
                        {highlightGrid}
                    </div>
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

            {teacherDoor && (
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
            )}
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
    const contentLoaded = useAppSelector(
        (state) => state.students.siteContentLoaded
    )
    useEffect(() => {
        dispatch(fetchTestimonialsRequested())
        dispatch(fetchSiteContentRequested())
    }, [dispatch])
    return (
        <HomeView
            testimonials={testimonials}
            content={content}
            contentLoaded={contentLoaded}
        />
    )
}
