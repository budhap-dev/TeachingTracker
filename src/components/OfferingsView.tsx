import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Button } from '@mui/material'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import type { SiteContent } from '../data/siteContent'
import { renderMarkdown } from '../utils/markdown'
import { subjectIcon } from '../utils/subjectIcons'


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
    const { hero, subjects, approach, freeform } = content
    // Which subject card is flipped (tapped). Hover flips on its own via CSS;
    // this makes the flip work on touch too, just for fun.
    const [flipped, setFlipped] = useState<string | null>(null)

    /* One container (owner calls, 2026-08-07): no headline/subhead (the
       pitch is Home's), no doors up top (the closing card has the
       button) — the Offerings card holds the subject cards directly. */
    const heroSection = (
            <div className="card offerings-hero" id="offerings-subjects">
                <h3 className="page-heading">
                    <LocalOfferOutlinedIcon fontSize="small" />
                    Offerings
                </h3>
                {hero.availability && (
                    <p className="offerings-availability">
                        {hero.availability}
                    </p>
                )}
                <h4 className="offerings-heading">Subjects taught</h4>
                {subjects.length > 0 ? (
                    <div className="offerings-subject-grid">
                        {subjects.map((subject) => {
                            const Icon = subjectIcon(subject.name)
                            const isFlipped = flipped === subject.name
                            const toggleFlip = () =>
                                setFlipped((current) =>
                                    current === subject.name
                                        ? null
                                        : subject.name
                                )
                            return (
                                <div
                                    key={subject.name}
                                    className={`offerings-subject-card ${isFlipped ? 'flipped' : ''}`}
                                    /* Keyboard/switch users flip too
                                       (REQ-042): a real button role with
                                       Enter/Space, announcing its state. */
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={isFlipped}
                                    aria-label={`${subject.name} card`}
                                    onClick={toggleFlip}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                        ) {
                                            event.preventDefault()
                                            toggleFlip()
                                        }
                                    }}
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
                                                    label={
                                                        content.modesLabel
                                                    }
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
                {/* The services checklist (owner list, 2026-08-07) —
                    published content, ticks supplied here. */}
                {content.services.length > 0 && (
                    <>
                        <h4 className="offerings-heading offerings-services-heading">
                            What I offer
                        </h4>
                        <ul className="offerings-services">
                            {content.services.map((line) => (
                                <li key={line}>
                                    <CheckCircleRoundedIcon
                                        className="offerings-point-tick"
                                        fontSize="small"
                                    />
                                    {line}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
    )

    // The journey renders on the Home hero screen now (owner call,
    // 2026-08-04) — saying it twice was padding. 'journey' stays valid in
    // sectionOrder; the steps are still edited in the site editor because
    // Home feeds from them.
    const journeySection = null

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
                {/* The pinned note on the corkboard — the wrapper is what
                    sways, carries the pin and wears the paper. */}
                <div className="freeform-note">
                    {freeform.heading && (
                        <h4 className="offerings-heading">
                            {freeform.heading}
                        </h4>
                    )}
                    {renderMarkdown(freeform.markdown)}
                </div>
            </div>
        ) : null

    // The bio renders on the About page now (REQ-037, owner content
    // received 2026-08-04). 'bio' stays valid in sectionOrder.
    const bioSection = null

    // The FAQ lives on its own page now (owner call, 2026-08-04) — the
    // 'faq' section key renders nothing here, but stays in sectionOrder so
    // older published documents keep validating.
    const faqSection = null

    const sections = {
        hero: heroSection,
        // Folded into the Offerings card above (owner call, 2026-08-07);
        // 'subjects' stays a valid sectionOrder key.
        subjects: null,
        journey: journeySection,
        approach: approachSection,
        bio: bioSection,
        faq: faqSection,
        freeform: freeformSection,
    }

    return (
        <section className="content-stack">
            {content.sectionOrder.map((key) =>
                sections[key] ? (
                    <div key={key} className="offerings-section">
                        {sections[key]}
                    </div>
                ) : null
            )}

            <div className="card offerings-closing">
                <div>
                    <h4 className="offerings-heading">Ready to start?</h4>
                    <p className="section-subtitle">
                        Request a free assessment and I’ll take it from there.
                    </p>
                </div>
                <Button
                    variant="contained"
                    endIcon={<ArrowForwardRoundedIcon />}
                    onClick={onBookAssessment}
                >
                    Request a free assessment
                </Button>
            </div>
        </section>
    )
}
