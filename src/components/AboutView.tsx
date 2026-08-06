import { useEffect, useState } from 'react'
import {
    Button,
    Checkbox,
    FormControlLabel,
    IconButton,
    TextField,
} from '@mui/material'
import { Link } from 'react-router-dom'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import EmojiObjectsOutlinedIcon from '@mui/icons-material/EmojiObjectsOutlined'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'
import AddAPhotoOutlinedIcon from '@mui/icons-material/AddAPhotoOutlined'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import { useIsAuthenticated } from '@azure/msal-react'
import { isAuthConfigured } from '../auth/msal'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
    fetchSiteContentRequested,
    publishSiteContentRequested,
} from '../store/store'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { renderMarkdown } from '../utils/markdown'
import { defaultSiteContent } from '../data/siteContent'
import type { BioSection, CvEntry, SiteContent } from '../data/siteContent'
import { paths } from '../paths'
import { PageLoading } from './PageLoading'

/** Editable CV rows, keyed like every list editor in the app. */
type CvRow = CvEntry & { key: string }
type SectionRow = { key: string; heading: string; markdown: string }

let rowCounter = 0
const newRowKey = () => `about-row-${++rowCounter}`

type AboutDraft = {
    heading: string
    photo: string
    body: string
    qualificationsText: string
    dbsChecked: boolean
    safeguarding: string
    experience: CvRow[]
    education: CvRow[]
    expectationsText: string
    sections: SectionRow[]
}

const toDraft = (bio: BioSection): AboutDraft => ({
    heading: bio.heading,
    photo: bio.photo,
    body: bio.body,
    qualificationsText: bio.qualifications.join('\n'),
    dbsChecked: bio.dbsChecked,
    safeguarding: bio.safeguarding,
    experience: bio.experience.map((entry) => ({
        key: newRowKey(),
        ...entry,
    })),
    education: bio.education.map((entry) => ({ key: newRowKey(), ...entry })),
    expectationsText: bio.expectations.join('\n'),
    sections: bio.sections.map((section) => ({
        key: newRowKey(),
        ...section,
    })),
})

const lines = (raw: string): string[] =>
    raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

/** The draft back into the publishable bio; titleless rows are left out. */
const assemble = (draft: AboutDraft): BioSection => ({
    heading: draft.heading.trim(),
    photo: draft.photo,
    body: draft.body,
    qualifications: lines(draft.qualificationsText),
    dbsChecked: draft.dbsChecked,
    safeguarding: draft.safeguarding.trim(),
    experience: draft.experience
        .filter((row) => row.title.trim())
        .map((row) => ({
            years: row.years.trim(),
            title: row.title.trim(),
            place: row.place.trim(),
            detail: row.detail.trim(),
        })),
    education: draft.education
        .filter((row) => row.title.trim())
        .map((row) => ({
            years: row.years.trim(),
            title: row.title.trim(),
            place: row.place.trim(),
            detail: row.detail.trim(),
        })),
    expectations: lines(draft.expectationsText),
    sections: draft.sections
        .filter((row) => row.heading.trim() || row.markdown.trim())
        .map((row) => ({
            heading: row.heading.trim(),
            markdown: row.markdown,
        })),
})

type AboutViewProps = {
    content: SiteContent
    /** The signed-in teacher (or auth-less local dev) edits in place. */
    canEdit: boolean
    publishing: boolean
    onPublish: (content: SiteContent) => void
}

/** Reads a picked image and downscales it to a small JPEG data-URI —
    ~240px longest side — so the single-property stored document stays far
    below Table Storage's 64KB ceiling. */
const readAndShrink = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const img = new Image()
            img.onload = () => {
                const max = 240
                const scale = Math.min(
                    1,
                    max / Math.max(img.width, img.height)
                )
                const canvas = document.createElement('canvas')
                canvas.width = Math.round(img.width * scale)
                canvas.height = Math.round(img.height * scale)
                canvas
                    .getContext('2d')!
                    .drawImage(img, 0, 0, canvas.width, canvas.height)
                resolve(canvas.toDataURL('image/jpeg', 0.78))
            }
            img.onerror = reject
            img.src = reader.result as string
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })

/** Professional glyphs cycling across the qualification cards — each in
    its own colour (blue scholar, green verified, gold trophy) against the
    block's gold ground. */
const qualIcons = [
    { Icon: SchoolRoundedIcon, tone: 'qual-icon-blue' },
    { Icon: VerifiedRoundedIcon, tone: 'qual-icon-green' },
    { Icon: EmojiEventsRoundedIcon, tone: 'qual-icon-gold' },
]

/** The expectation points cycle their own coloured glyphs — green tick,
    blue target, gold star — matching the qualification cards' language. */
const expectationIcons = [
    { Icon: CheckCircleRoundedIcon, tone: 'qual-icon-green' },
    { Icon: TrackChangesRoundedIcon, tone: 'qual-icon-blue' },
    { Icon: StarRoundedIcon, tone: 'qual-icon-gold' },
]

/** A glyph for an owner-written section, matched by heading keyword —
    the subjectIcons pattern; notes stand in for anything unrecognised. */
const sectionIcon = (heading: string) => {
    const lower = heading.toLowerCase()
    if (lower.includes('philosoph') || lower.includes('approach')) {
        return EmojiObjectsOutlinedIcon
    }
    if (lower.includes('promise') || lower.includes('commit')) {
        return HandshakeOutlinedIcon
    }
    return NotesOutlinedIcon
}

/** A bordered section panel: icon + heading, then its content. */
const AboutBlock = ({
    icon: Icon,
    heading,
    children,
    tone = '',
}: {
    icon: typeof NotesOutlinedIcon
    heading: string
    children: React.ReactNode
    /** 'gold' dresses a block as an achievement showcase. */
    tone?: string
}) => (
    <div className={`about-block ${tone}`.trim()}>
        <h4 className="about-block-heading">
            <Icon fontSize="small" aria-hidden />
            {heading}
        </h4>
        {children}
    </div>
)

/** A dated CV list — quiet years column, title, place, one-line detail. */
const CvList = ({
    heading,
    entries,
    icon,
}: {
    heading: string
    entries: CvEntry[]
    icon: typeof NotesOutlinedIcon
}) =>
    entries.length > 0 ? (
        <AboutBlock icon={icon} heading={heading}>
            <ol className="about-cv-list">
                {entries.map((entry) => (
                    <li key={`${entry.years}-${entry.title}`}>
                        <span className="about-cv-years">{entry.years}</span>
                        <div>
                            <strong>{entry.title}</strong>
                            {entry.place && <span> · {entry.place}</span>}
                            {entry.detail && <p>{entry.detail}</p>}
                        </div>
                    </li>
                ))}
            </ol>
        </AboutBlock>
    ) : null

/**
 * "About the teacher" (REQ-037): the CV-style public page — intro, trust
 * row, timelines, expectations, the owner's own sections — edited in place
 * by the teacher, the FAQ-page pattern.
 */
export const AboutView = ({
    content,
    canEdit,
    publishing,
    onPublish,
}: AboutViewProps) => {
    useDocumentMeta(
        'About the teacher — AbhiTutor',
        'Meet Mrs Abhinanda Pandit: Maths Mentor at a Leeds secondary school, physics graduate, and tutor with 20+ years of teaching experience.'
    )
    const { bio, hero } = content
    const [draft, setDraft] = useState<AboutDraft>(() => toDraft(bio))
    const [photoError, setPhotoError] = useState<string | null>(null)
    const [edited, setEdited] = useState(false)
    useEffect(() => {
        if (!edited) {
            setDraft(toDraft(bio))
        }
    }, [bio, edited])

    const edit = (mutate: (next: AboutDraft) => AboutDraft) => {
        setEdited(true)
        setDraft((current) => mutate(current))
    }

    const assembled = assemble(draft)
    const dirty = JSON.stringify(assembled) !== JSON.stringify(bio)
    // The teacher sees the page AS THE DRAFT — photo, rows, everything —
    // before publishing; visitors see only the published document.
    const view = canEdit ? assembled : bio
    const empty =
        !view.heading &&
        !view.body &&
        view.qualifications.length === 0 &&
        view.experience.length === 0

    const cvRowEditor = (
        list: 'experience' | 'education',
        rows: CvRow[]
    ) => (
        <div className="sortable-rows">
            {rows.map((row) => (
                <div key={row.key} className="about-cv-row">
                    <TextField
                        label="Years"
                        size="small"
                        value={row.years}
                        onChange={(event) =>
                            edit((next) => ({
                                ...next,
                                [list]: next[list].map((item) =>
                                    item.key === row.key
                                        ? { ...item, years: event.target.value }
                                        : item
                                ),
                            }))
                        }
                    />
                    <TextField
                        label="Title"
                        size="small"
                        value={row.title}
                        onChange={(event) =>
                            edit((next) => ({
                                ...next,
                                [list]: next[list].map((item) =>
                                    item.key === row.key
                                        ? { ...item, title: event.target.value }
                                        : item
                                ),
                            }))
                        }
                    />
                    <TextField
                        label="Place"
                        size="small"
                        value={row.place}
                        onChange={(event) =>
                            edit((next) => ({
                                ...next,
                                [list]: next[list].map((item) =>
                                    item.key === row.key
                                        ? { ...item, place: event.target.value }
                                        : item
                                ),
                            }))
                        }
                    />
                    <TextField
                        label="Detail"
                        size="small"
                        value={row.detail}
                        onChange={(event) =>
                            edit((next) => ({
                                ...next,
                                [list]: next[list].map((item) =>
                                    item.key === row.key
                                        ? {
                                              ...item,
                                              detail: event.target.value,
                                          }
                                        : item
                                ),
                            }))
                        }
                    />
                    <IconButton
                        size="small"
                        aria-label={`Remove ${row.title || 'new entry'}`}
                        onClick={() =>
                            edit((next) => ({
                                ...next,
                                [list]: next[list].filter(
                                    (item) => item.key !== row.key
                                ),
                            }))
                        }
                    >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                </div>
            ))}
        </div>
    )

    return (
        <section className="content-stack about-page">
            <div className="card">
                <div className="section-header">
                    <div>
                        <h3 className="page-heading">
                            <PersonOutlineRoundedIcon fontSize="small" />
                            {view.heading || 'About the teacher'}
                        </h3>
                    </div>
                    {canEdit && dirty && (
                        <span className="about-preview-hint">
                            Previewing unsaved changes
                        </span>
                    )}
                    {canEdit && (
                        <Button
                            variant="contained"
                            disabled={publishing || !dirty}
                            onClick={() =>
                                onPublish({ ...content, bio: assembled })
                            }
                        >
                            {publishing ? 'Publishing…' : 'Publish About'}
                        </Button>
                    )}
                </div>

                {empty && (
                    <p className="section-subtitle">
                        {canEdit
                            ? 'Nothing published yet — load the prepared content below, adjust, and publish.'
                            : 'The teacher’s introduction is on its way.'}
                    </p>
                )}

                {(bio.body || bio.photo) && (
                    <div className="about-lead">
                        {bio.photo && (
                            <img
                                className="about-photo"
                                src={bio.photo}
                                alt={`Portrait of ${content.siteName}'s tutor`}
                            />
                        )}
                        {bio.body && (
                            <div className="about-intro">
                                {renderMarkdown(bio.body)}
                            </div>
                        )}
                    </div>
                )}

                {/* The trust row: strictly owner-set signals. */}
                {(bio.dbsChecked ||
                    bio.safeguarding ||
                    (hero.experienceYears ?? 0) > 0) && (
                    <div className="about-trust-row">
                        {bio.dbsChecked && (
                            <span className="about-dbs-badge">
                                <CheckCircleRoundedIcon fontSize="small" />
                                Enhanced DBS checked
                            </span>
                        )}
                        {(hero.experienceYears ?? 0) > 0 && (
                            <span className="about-trust-chip">
                                {hero.experienceYears}+ years teaching
                            </span>
                        )}
                        {bio.safeguarding && (
                            <span className="about-safeguarding">
                                {bio.safeguarding}
                            </span>
                        )}
                    </div>
                )}

                {/* Desktop uses the width as a CV would: the story runs
                    down the main column, credentials sit in the rail. On
                    phones the rail stacks first — solid points early. */}
                <div className="about-columns">
                    <div className="about-rail">
                        {bio.qualifications.length > 0 && (
                            <AboutBlock
                                icon={WorkspacePremiumOutlinedIcon}
                                heading="Qualifications"
                            >
                                <div className="about-quals">
                                    {bio.qualifications.map(
                                        (line, index) => {
                                            const { Icon, tone } =
                                                qualIcons[
                                                    index % qualIcons.length
                                                ]
                                            return (
                                                <span
                                                    key={line}
                                                    className="about-qual-pill"
                                                >
                                                    <Icon
                                                        className={tone}
                                                        fontSize="small"
                                                        aria-hidden
                                                    />
                                                    {line}
                                                </span>
                                            )
                                        }
                                    )}
                                </div>
                            </AboutBlock>
                        )}
                        {bio.expectations.length > 0 && (
                            <AboutBlock
                                icon={FactCheckOutlinedIcon}
                                heading="What you can expect"
                            >
                                <ul className="about-expectations">
                                    {bio.expectations.map((line, index) => {
                                        const { Icon, tone } =
                                            expectationIcons[
                                                index %
                                                    expectationIcons.length
                                            ]
                                        return (
                                            <li key={line}>
                                                <Icon
                                                    className={tone}
                                                    fontSize="small"
                                                    aria-hidden
                                                />
                                                {line}
                                            </li>
                                        )
                                    })}
                                </ul>
                            </AboutBlock>
                        )}
                    </div>
                    <div className="about-main">
                        <CvList
                            heading="Teaching experience"
                            entries={bio.experience}
                            icon={WorkOutlineRoundedIcon}
                        />
                        <CvList
                            heading="Education"
                            entries={bio.education}
                            icon={SchoolOutlinedIcon}
                        />
                        {bio.sections.map((section) => {
                            const Icon = sectionIcon(section.heading)
                            return (
                                <AboutBlock
                                    key={section.heading}
                                    icon={Icon}
                                    heading={section.heading}
                                >
                                    <div className="about-section-body">
                                        {renderMarkdown(section.markdown)}
                                    </div>
                                </AboutBlock>
                            )
                        })}
                    </div>
                </div>

                <div className="pricing-cta-actions about-cta">
                    <Button
                        variant="contained"
                        component={Link}
                        to={paths.enquire}
                    >
                        Request a free assessment
                    </Button>
                    <Button
                        variant="outlined"
                        component={Link}
                        to={paths.contact}
                    >
                        Contact us
                    </Button>
                </div>
            </div>

            {canEdit && (
                <div className="card">
                    <div className="section-header">
                        <div>
                            <h4 className="offerings-heading">
                                Edit the About page
                            </h4>
                            <p className="section-subtitle">
                                Changes publish from this page. CV rows
                                missing a title are left out when you
                                publish.
                            </p>
                        </div>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                                edit(() => toDraft(defaultSiteContent.bio))
                            }
                        >
                            Load the prepared content
                        </Button>
                    </div>
                    <div className="site-editor-fields">
                        <TextField
                            label="Page heading"
                            size="small"
                            value={draft.heading}
                            onChange={(event) =>
                                edit((next) => ({
                                    ...next,
                                    heading: event.target.value,
                                }))
                            }
                        />
                        <div className="about-block about-photo-block">
                            <h4 className="about-block-heading">
                                <AddAPhotoOutlinedIcon
                                    fontSize="small"
                                    aria-hidden
                                />
                                Profile photo
                            </h4>
                            <div className="about-photo-editor">
                                {draft.photo ? (
                                    <img
                                        className="about-photo small"
                                        src={draft.photo}
                                        alt="Profile photo preview"
                                    />
                                ) : (
                                    <span className="section-subtitle">
                                        No photo yet — it shows beside your
                                        introduction. Any image works; it
                                        is resized automatically.
                                    </span>
                                )}
                                <Button
                                    size="small"
                                    variant="outlined"
                                    component="label"
                                >
                                    {draft.photo
                                        ? 'Replace photo'
                                        : 'Add profile photo'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="visually-hidden-input"
                                        onChange={(event) => {
                                            const file =
                                                event.target.files?.[0]
                                            // Same-file re-picks must fire.
                                            event.target.value = ''
                                            if (!file) {
                                                return
                                            }
                                            setPhotoError(null)
                                            readAndShrink(file).then(
                                                (photo) =>
                                                    edit((next) => ({
                                                        ...next,
                                                        photo,
                                                    })),
                                                () =>
                                                    setPhotoError(
                                                        'That image could not be read — HEIC photos from iPhones sometimes fail; a JPG or PNG will work.'
                                                    )
                                            )
                                        }}
                                    />
                                </Button>
                                {draft.photo && (
                                    <Button
                                        size="small"
                                        onClick={() =>
                                            edit((next) => ({
                                                ...next,
                                                photo: '',
                                            }))
                                        }
                                    >
                                        Remove photo
                                    </Button>
                                )}
                            </div>
                            {photoError && (
                                <p className="review-field-error">
                                    {photoError}
                                </p>
                            )}
                        </div>
                        <TextField
                            label="Introduction (Markdown)"
                            size="small"
                            multiline
                            minRows={5}
                            value={draft.body}
                            onChange={(event) =>
                                edit((next) => ({
                                    ...next,
                                    body: event.target.value,
                                }))
                            }
                        />
                        <TextField
                            label="Qualifications — one per line"
                            size="small"
                            multiline
                            value={draft.qualificationsText}
                            onChange={(event) =>
                                edit((next) => ({
                                    ...next,
                                    qualificationsText: event.target.value,
                                }))
                            }
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={draft.dbsChecked}
                                    onChange={(event) =>
                                        edit((next) => ({
                                            ...next,
                                            dbsChecked: event.target.checked,
                                        }))
                                    }
                                />
                            }
                            label="Show the “Enhanced DBS checked” badge — tick only if your certificate is current"
                        />
                        <TextField
                            label="Safeguarding statement"
                            size="small"
                            multiline
                            value={draft.safeguarding}
                            onChange={(event) =>
                                edit((next) => ({
                                    ...next,
                                    safeguarding: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="section-header pricing-factors-header">
                        <h4 className="offerings-heading">
                            Teaching experience
                        </h4>
                        <Button
                            size="small"
                            startIcon={<AddRoundedIcon fontSize="small" />}
                            onClick={() =>
                                edit((next) => ({
                                    ...next,
                                    experience: [
                                        ...next.experience,
                                        {
                                            key: newRowKey(),
                                            years: '',
                                            title: '',
                                            place: '',
                                            detail: '',
                                        },
                                    ],
                                }))
                            }
                        >
                            Add entry
                        </Button>
                    </div>
                    {cvRowEditor('experience', draft.experience)}

                    <div className="section-header pricing-factors-header">
                        <h4 className="offerings-heading">Education</h4>
                        <Button
                            size="small"
                            startIcon={<AddRoundedIcon fontSize="small" />}
                            onClick={() =>
                                edit((next) => ({
                                    ...next,
                                    education: [
                                        ...next.education,
                                        {
                                            key: newRowKey(),
                                            years: '',
                                            title: '',
                                            place: '',
                                            detail: '',
                                        },
                                    ],
                                }))
                            }
                        >
                            Add entry
                        </Button>
                    </div>
                    {cvRowEditor('education', draft.education)}

                    <div className="site-editor-fields pricing-factors-header">
                        <TextField
                            label="What you can expect — one per line"
                            size="small"
                            multiline
                            value={draft.expectationsText}
                            onChange={(event) =>
                                edit((next) => ({
                                    ...next,
                                    expectationsText: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="section-header pricing-factors-header">
                        <h4 className="offerings-heading">Extra sections</h4>
                        <Button
                            size="small"
                            startIcon={<AddRoundedIcon fontSize="small" />}
                            onClick={() =>
                                edit((next) => ({
                                    ...next,
                                    sections: [
                                        ...next.sections,
                                        {
                                            key: newRowKey(),
                                            heading: '',
                                            markdown: '',
                                        },
                                    ],
                                }))
                            }
                        >
                            Add section
                        </Button>
                    </div>
                    <div className="sortable-rows">
                        {draft.sections.map((row) => (
                            <div
                                key={row.key}
                                className="site-editor-point-row"
                            >
                                <TextField
                                    label="Heading"
                                    size="small"
                                    value={row.heading}
                                    onChange={(event) =>
                                        edit((next) => ({
                                            ...next,
                                            sections: next.sections.map(
                                                (item) =>
                                                    item.key === row.key
                                                        ? {
                                                              ...item,
                                                              heading:
                                                                  event.target
                                                                      .value,
                                                          }
                                                        : item
                                            ),
                                        }))
                                    }
                                />
                                <TextField
                                    label="Body (Markdown)"
                                    size="small"
                                    multiline
                                    value={row.markdown}
                                    onChange={(event) =>
                                        edit((next) => ({
                                            ...next,
                                            sections: next.sections.map(
                                                (item) =>
                                                    item.key === row.key
                                                        ? {
                                                              ...item,
                                                              markdown:
                                                                  event.target
                                                                      .value,
                                                          }
                                                        : item
                                            ),
                                        }))
                                    }
                                />
                                <IconButton
                                    size="small"
                                    aria-label={`Remove ${row.heading || 'new section'}`}
                                    onClick={() =>
                                        edit((next) => ({
                                            ...next,
                                            sections: next.sections.filter(
                                                (item) =>
                                                    item.key !== row.key
                                            ),
                                        }))
                                    }
                                >
                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    )
}

const AboutConnected = ({ canEdit }: { canEdit: boolean }) => {
    const dispatch = useAppDispatch()
    const content = useAppSelector((state) => state.students.siteContent)
    const publishing = useAppSelector(
        (state) => state.students.publishingSiteContent
    )
    const loaded = useAppSelector(
        (state) => state.students.siteContentLoaded
    )
    useEffect(() => {
        dispatch(fetchSiteContentRequested())
    }, [dispatch])
    // Until the published document lands, showing the bundled defaults
    // would flash claims the owner may not have published (the REQ-022
    // refresh flicker) — wait for the first fetch to settle.
    if (!loaded) {
        return <PageLoading />
    }
    return (
        <AboutView
            content={content}
            canEdit={canEdit}
            publishing={publishing}
            onPublish={(next) => dispatch(publishSiteContentRequested(next))}
        />
    )
}

const AboutAuthed = () => <AboutConnected canEdit={useIsAuthenticated()} />

/** The connected About page: public; the teacher edits in place. */
export const AboutLanding = () =>
    isAuthConfigured() ? <AboutAuthed /> : <AboutConnected canEdit={true} />
