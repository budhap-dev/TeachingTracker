import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Button } from '@mui/material'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import FunctionsRoundedIcon from '@mui/icons-material/FunctionsRounded'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import type { SvgIconComponent } from '@mui/icons-material'
import type { SiteContent } from '../data/siteContent'
import { renderMarkdown } from '../utils/markdown'

/** A subject-appropriate glyph; a book stands in for anything unrecognised. */
const subjectIcon = (name: string): SvgIconComponent =>
    ({
        Mathematics: FunctionsRoundedIcon,
        Physics: BoltRoundedIcon,
        Chemistry: ScienceRoundedIcon,
        Biology: BiotechRoundedIcon,
    })[name] ?? MenuBookRoundedIcon

/** Five playful, subject-relevant emoji that cycle on the flip side, for fun. */
const subjectImages = (name: string): string[] =>
    ({
        Mathematics: ['📐', '📏', '➗', '🔢', '📊'],
        Physics: ['⚛️', '🔭', '🧲', '💡', '🚀'],
        Chemistry: ['🧪', '⚗️', '🧫', '🔬', '💥'],
        Biology: ['🔬', '🧬', '🌱', '🦠', '🧠'],
    })[name] ?? ['📚', '✏️', '🎓', '🗺️', '🔎']

type OfferingsViewProps = {
    /** The whole teacher-published document (REQ-008); sections render in
        its `sectionOrder`. */
    content: SiteContent
    /** Starts the enquiry (REQ-018). */
    onBookAssessment: () => void
}

/** A friendly glyph for each journey step, in order. */
const journeyIcons = ['💬', '📝', '🎯', '📅']

/** One label/value row of the subject spec table — omitted when empty. */
const SpecRow = ({ label, values }: { label: string; values?: string[] }) =>
    values && values.length > 0 ? (
        <div className="subject-spec">
            <dt>{label}</dt>
            <dd>
                {values.map((value) => (
                    <span key={value} className="subject-chip">
                        {value}
                    </span>
                ))}
            </dd>
        </div>
    ) : null

/**
 * Public page: what is taught, how it works, and one clear way to start.
 * Renders the teacher-published document (REQ-008) section by section, in the
 * order the teacher arranged them in the site editor.
 */
export const OfferingsView = ({
    content,
    onBookAssessment,
}: OfferingsViewProps) => {
    const { hero, subjects, journey, approach, freeform } = content
    // Which subject card is flipped (tapped). Hover flips on its own via CSS;
    // this makes the flip work on touch too, just for fun.
    const [flipped, setFlipped] = useState<string | null>(null)

    const heroSection = (
            <div className="card offerings-hero">
                <h3 className="page-heading">
                    <LocalOfferOutlinedIcon fontSize="small" />
                    Offerings
                </h3>
                <p className="offerings-hero-headline">{hero.headline}</p>
                <p className="offerings-hero-subhead">{hero.subhead}</p>
                {hero.availability && (
                    <p className="offerings-availability">
                        {hero.availability}
                    </p>
                )}
                <div className="offerings-cta">
                    <Button
                        variant="contained"
                        endIcon={<ArrowForwardRoundedIcon />}
                        onClick={onBookAssessment}
                    >
                        Book a free assessment
                    </Button>
                    <a
                        className="offerings-cta-secondary"
                        href="#offerings-subjects"
                    >
                        See subjects
                    </a>
                </div>
            </div>
    )

    const subjectsSection = (
            <div className="card" id="offerings-subjects">
                <h4 className="offerings-heading">Subjects taught</h4>
                {subjects.length > 0 ? (
                    <div className="offerings-subject-grid">
                        {subjects.map((subject) => {
                            const Icon = subjectIcon(subject.name)
                            const isFlipped = flipped === subject.name
                            return (
                                <div
                                    key={subject.name}
                                    className={`offerings-subject-card ${isFlipped ? 'flipped' : ''}`}
                                    onClick={() =>
                                        setFlipped((current) =>
                                            current === subject.name
                                                ? null
                                                : subject.name
                                        )
                                    }
                                >
                                    <div className="subject-card-inner">
                                        <div className="subject-card-front">
                                            <h5 className="offerings-subject-name">
                                                <span className="offerings-subject-icon">
                                                    <Icon fontSize="small" />
                                                </span>
                                                {subject.name}
                                            </h5>
                                            <dl className="subject-specs">
                                                <SpecRow
                                                    label="Levels"
                                                    values={subject.keyStages}
                                                />
                                                <SpecRow
                                                    label="Exam boards"
                                                    values={subject.examBoards}
                                                />
                                                <SpecRow
                                                    label="Delivery"
                                                    values={subject.modes}
                                                />
                                            </dl>
                                        </div>
                                        <div
                                            className="subject-card-back"
                                            aria-hidden="true"
                                        >
                                            <div className="subject-card-stage">
                                                {subjectImages(
                                                    subject.name
                                                ).map((emoji, imageIndex) => (
                                                    <span
                                                        key={imageIndex}
                                                        className="subject-card-emoji"
                                                        style={
                                                            {
                                                                animationDelay: `${imageIndex * 1.2}s`,
                                                            } as CSSProperties
                                                        }
                                                    >
                                                        {emoji}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="subject-card-back-label">
                                                {subject.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className="section-subtitle">
                        Subject list coming soon — please get in touch.
                    </p>
                )}
            </div>
    )

    const journeySection = (
            <div className="card">
                <h4 className="offerings-heading">How it works</h4>
                <ol className="offerings-journey">
                    {journey.map((step, index) => (
                        <li key={step.title} className="offerings-step">
                            <span
                                className="offerings-step-icon"
                                aria-hidden="true"
                            >
                                {journeyIcons[index]}
                            </span>
                            <div className="offerings-step-body">
                                <h5 className="offerings-step-title">
                                    {step.title}
                                </h5>
                                <p className="offerings-step-detail">
                                    {step.detail}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
    )

    const approachSection = (
            <div className="card">
                <h4 className="offerings-heading">
                    Why families choose {content.siteName}
                </h4>
                <ul className="offerings-approach">
                    {approach.map((point) => (
                        <li key={point.title} className="offerings-point">
                            <CheckCircleRoundedIcon
                                className="offerings-point-tick"
                                fontSize="small"
                            />
                            <div>
                                <h5 className="offerings-point-title">
                                    {point.title}
                                </h5>
                                <p className="offerings-point-detail">
                                    {point.detail}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
    )

    // The free-form section (REQ-008): rendered from Markdown to React nodes
    // — never raw HTML — and skipped entirely while the teacher hasn't
    // written one.
    const freeformSection =
        freeform.heading || freeform.markdown ? (
            <div className="card offerings-freeform">
                {freeform.heading && (
                    <h4 className="offerings-heading">{freeform.heading}</h4>
                )}
                {renderMarkdown(freeform.markdown)}
            </div>
        ) : null

    const sections = {
        hero: heroSection,
        subjects: subjectsSection,
        journey: journeySection,
        approach: approachSection,
        freeform: freeformSection,
    }

    return (
        <section className="content-stack">
            {content.sectionOrder.map((key) => (
                <div key={key} className="offerings-section">
                    {sections[key]}
                </div>
            ))}

            <div className="card offerings-closing">
                <div>
                    <h4 className="offerings-heading">Ready to start?</h4>
                    <p className="section-subtitle">
                        Book a free assessment and we’ll take it from there.
                    </p>
                </div>
                <Button
                    variant="contained"
                    endIcon={<ArrowForwardRoundedIcon />}
                    onClick={onBookAssessment}
                >
                    Book a free assessment
                </Button>
            </div>
        </section>
    )
}
