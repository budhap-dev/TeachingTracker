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
import { renderMarkdown } from '../utils/markdown'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import LaptopChromebookOutlinedIcon from '@mui/icons-material/LaptopChromebookOutlined'
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded'
import SelfImprovementRoundedIcon from '@mui/icons-material/SelfImprovementRounded'
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import StarOutlineRoundedIcon from '@mui/icons-material/StarOutlineRounded'

import { subjectIcon } from '../utils/subjectIcons'
import { paths } from '../paths'
import { HomeReviews } from './HomeReviews'
import { PageLoading } from './PageLoading'
import type { Testimonial } from '../data/students'

import type { SiteContent } from '../data/siteContent'
import { defaultSiteContent } from '../data/siteContent'
import { SiteStructuredData } from './SiteStructuredData'
import { familyReviewSummary } from '../utils/structuredData'

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
    // The page's own words are the owner's (2026-08-14): headings, button
    // labels and the search-result copy all come from the published
    // document. `||` not `??` throughout — a cleared field means "use the
    // shipped wording", never an empty heading or a nameless button.
    const home = content.home
    useDocumentMeta(
        home.metaTitle || defaultSiteContent.home.metaTitle,
        home.metaDescription || defaultSiteContent.home.metaDescription
    )
    const { hero, journey } = content
    // The teacher door (owner ask, 2026-08-06): the sign-in afterline is
    // hidden from visitors and revealed by five quick taps on the hero
    // badge — a UX tidy-up, not security; sign-in stays Microsoft-gated.
    // The reveal holds for the rest of the browser session.
    // A published notice is the day's headline: when it exists, the
    // page opens ON it (owner ask, 2026-08-11) — one scroll on load,
    // then the pin-on animation plays where the visitor is looking.
    const noticeRef = useRef<HTMLDivElement>(null)
    const hasNotice = Boolean(
        content.freeform.heading || content.freeform.markdown
    )
    // The pin waits for the auto-scroll to settle, so the oscillation
    // happens where the visitor is already looking (owner refinement,
    // 2026-08-11).
    const [noticePinned, setNoticePinned] = useState(false)
    useEffect(() => {
        if (contentLoaded && hasNotice) {
            // Scroll target (owner refinement, 2026-08-11): tuck the
            // greeting's redundant AbhiTutor lockup under the sticky band
            // - the view starts at the offer line + quote, notice below.
            // Fall back to the notice itself if the anchor isn't there.
            const anchor = document.querySelector('.visitor-offer-line')
            const behavior = (window.matchMedia?.(
                '(prefers-reduced-motion: reduce)'
            ).matches ?? true)
                ? ('auto' as const)
                : ('smooth' as const)
            if (anchor) {
                anchor.scrollIntoView?.({ behavior, block: 'start' })
            } else {
                noticeRef.current?.scrollIntoView?.({
                    behavior,
                    block: 'nearest',
                })
            }
            const timer = setTimeout(() => setNoticePinned(true), 550)
            return () => clearTimeout(timer)
        }
    }, [contentLoaded, hasNotice])
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
    const experienceYears = contentLoaded ? (hero.experienceYears ?? 0) : 0
    // Shared with the LocalBusiness markup (REQ-043), so the stars a search
    // result shows are the stars the page shows.
    const { count: reviewCount, average: averageRating } =
        familyReviewSummary(testimonials)
    // The levels and boards chips: distinct values across the published
    // subjects, in first-seen order — "KS3 · GCSE · A-level", "AQA ·
    // Edexcel · OCR". Both are the teacher's own content, never hardcoded.
    const levels = Array.from(
        new Set(
            content.subjects.flatMap((subject) => subject.keyStages ?? [])
        )
    ).join(' · ')
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
    const highlightsHeading =
        home.highlightsHeading || defaultSiteContent.home.highlightsHeading
    const highlightGrid =
        contentLoaded && content.highlights.length > 0 ? (
            <ul className="home-highlights" aria-label={highlightsHeading}>
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
            {/* The pinned note (the freeform section) leads the page when
                written (owner call, 2026-08-10) — announcements sit
                between the header and the band, impossible to miss. */}
            {contentLoaded && hasNotice && (
                    <div
                        className={`card offerings-freeform ${noticePinned ? 'pin-play' : 'pin-wait'}`}
                        ref={noticeRef}
                    >
                        <div className="freeform-note">
                            {content.freeform.heading && (
                                <h4 className="offerings-heading">
                                    {content.freeform.heading}
                                </h4>
                            )}
                            {renderMarkdown(content.freeform.markdown)}
                        </div>
                    </div>
                )}

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
                        {/* An Enter in the editor's headline is a soft
                            break: phones break there (owner ask,
                            2026-08-12), desktop reads it as a space. */}
                        <h3 className="home-band-headline">
                            {hero.headline
                                .split('\n')
                                .flatMap((line, index) =>
                                    index === 0
                                        ? [line]
                                        : [
                                              <br
                                                  key={index}
                                                  className="phone-break"
                                              />,
                                              // The leading space keeps the
                                              // one-line desktop reading;
                                              // it collapses after a break.
                                              ` ${line}`,
                                          ]
                                )}
                        </h3>
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
                        {home.ctaLabel || defaultSiteContent.home.ctaLabel}
                    </Button>
                    <Link className="home-band-more" to={paths.offerings}>
                        {home.exploreLabel ||
                            defaultSiteContent.home.exploreLabel}{' '}
                        →
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
                    </ul>
                )}
            </div>

            {/* What we teach, without a click — literally: the chips are
                plain badges now (owner call, 2026-08-11); the band's
                "Explore subjects" button is the door to the cards. */}
            {content.subjects.length > 0 && (
                <div
                    className="home-subject-chips"
                    aria-label="Subjects taught"
                >
                    {content.subjects.map((subject) => {
                        const Icon = subjectIcon(subject.name)
                        return (
                            <span
                                key={subject.name}
                                className="home-subject-chip"
                            >
                                <Icon fontSize="small" aria-hidden />
                                {subject.name}
                            </span>
                        )
                    })}
                </div>
            )}

            {/* Proof where the decision is made (REQ-059): the three reviews
                the teacher chose, straight after the band and its one row of
                subject chips — so the words arrive while the call to action
                is still on screen. This reinstates parent quotes on Home,
                retired from the hero on 2026-08-06, as a curated three
                rather than the single rotating quote that was removed. */}
            <HomeReviews testimonials={testimonials} />

            {/* The reasons + the journey at a glance, side by side. The trust
                chips' ★ average carries the number; the strip above carries
                the words. */}
            <div className="home-proof-row">
                {highlightGrid && (
                    <div className="card home-highlights-card">
                        <h4 className="offerings-heading">
                            {highlightsHeading}
                        </h4>
                        {highlightGrid}
                    </div>
                )}
                <div className="card home-journey-mini">
                    <h4 className="offerings-heading">
                        {home.journeyHeading ||
                            defaultSiteContent.home.journeyHeading}
                    </h4>
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
 * The connected Home: loads the approved reviews and the published
 * document, and waits for the document before painting — the pinned
 * note used to pop in above the band mid-read (owner report,
 * 2026-08-11), so the loader holds the page like Pricing/FAQ/About do.
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
    if (!contentLoaded) {
        return <PageLoading />
    }
    return (
        <>
            {/* Search engines read the business from the same published
                document the page renders (REQ-043). */}
            <SiteStructuredData
                content={content}
                testimonials={testimonials}
            />
            <HomeView
                testimonials={testimonials}
                content={content}
                contentLoaded={contentLoaded}
            />
        </>
    )
}
