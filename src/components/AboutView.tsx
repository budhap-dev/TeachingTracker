import { useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Slider,
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

/** The API stores the photo inline in the single-property document and
    rejects base64 beyond 16k characters — stay safely under it. */
const PHOTO_BASE64_BUDGET = 15000

/** Reads a picked file into a decoded image, ready for cropping. */
const readImage = (file: File): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error('photo-unreadable'))
            img.src = reader.result as string
        }
        reader.onerror = () => reject(new Error('photo-unreadable'))
        reader.readAsDataURL(file)
    })

/** The centred square of an image — the crop when the owner just hits
    "Use photo" without adjusting. */
const centredSquare = (img: HTMLImageElement): Area => {
    const side = Math.min(img.width, img.height)
    return {
        x: (img.width - side) / 2,
        y: (img.height - side) / 2,
        width: side,
        height: side,
    }
}

/** Draws the cropped area to a small JPEG data-URI, stepping size and
    quality down until it fits the API's ceiling — a busy photo at one
    fixed setting can weigh 4x the budget (owner report, 2026-08-06). */
const shrinkToBudget = (img: HTMLImageElement, area: Area): string => {
    const attempts = [
        { max: 240, quality: 0.78 },
        { max: 240, quality: 0.6 },
        { max: 200, quality: 0.55 },
        { max: 170, quality: 0.5 },
        { max: 140, quality: 0.45 },
        { max: 110, quality: 0.4 },
    ]
    for (const { max, quality } of attempts) {
        const scale = Math.min(1, max / Math.max(area.width, area.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(area.width * scale))
        canvas.height = Math.max(1, Math.round(area.height * scale))
        canvas
            .getContext('2d')!
            .drawImage(
                img,
                area.x,
                area.y,
                area.width,
                area.height,
                0,
                0,
                canvas.width,
                canvas.height
            )
        const url = canvas.toDataURL('image/jpeg', quality)
        if (
            url.length - 'data:image/jpeg;base64,'.length <=
            PHOTO_BASE64_BUDGET
        ) {
            return url
        }
    }
    throw new Error('photo-too-large')
}

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
    const photoInput = useRef<HTMLInputElement>(null)
    // The picked image stays in memory so the crop can be reopened and
    // adjusted until the photo is replaced or removed (session-only).
    const [cropSource, setCropSource] = useState<HTMLImageElement | null>(
        null
    )
    const [cropOpen, setCropOpen] = useState(false)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [cropArea, setCropArea] = useState<Area | null>(null)
    const applyCrop = () => {
        if (!cropSource) {
            return
        }
        try {
            const photo = shrinkToBudget(
                cropSource,
                cropArea ?? centredSquare(cropSource)
            )
            edit((next) => ({ ...next, photo }))
            setCropOpen(false)
        } catch {
            setCropOpen(false)
            setPhotoError(
                'That photo is too detailed to store — please try a simpler or smaller image.'
            )
        }
    }
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
    // The published side goes through the same assemble path before the
    // stringify comparison — the API's key order differs from ours, and
    // comparing raw kept Publish lit forever (owner report, 2026-08-06).
    const dirty =
        JSON.stringify(assembled) !== JSON.stringify(assemble(toDraft(bio)))
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

                {(view.body || view.photo) && (
                    <div className="about-lead">
                        {view.photo && (
                            <img
                                className="about-photo"
                                src={view.photo}
                                alt={`Portrait of ${content.siteName}'s tutor`}
                            />
                        )}
                        {view.body && (
                            <div className="about-intro">
                                {renderMarkdown(view.body)}
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
                                {/* A plain button opening the picker
                                    programmatically — label-forwarding to
                                    a clipped input proved unreliable on
                                    the owner's devices (2026-08-06). */}
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() =>
                                        photoInput.current?.click()
                                    }
                                >
                                    {draft.photo
                                        ? 'Replace photo'
                                        : 'Add profile photo'}
                                </Button>
                                <input
                                    ref={photoInput}
                                    type="file"
                                    accept="image/*"
                                    className="visually-hidden-input"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0]
                                        // Same-file re-picks must fire.
                                        event.target.value = ''
                                        if (!file) {
                                            return
                                        }
                                        setPhotoError(null)
                                        readImage(file).then(
                                            (img) => {
                                                setCropSource(img)
                                                setCrop({ x: 0, y: 0 })
                                                setZoom(1)
                                                setCropArea(null)
                                                setCropOpen(true)
                                            },
                                            () =>
                                                setPhotoError(
                                                    'That image could not be read — HEIC photos from iPhones sometimes fail; a JPG or PNG will work.'
                                                )
                                        )
                                    }}
                                />
                                {cropSource && draft.photo && (
                                    <Button
                                        size="small"
                                        onClick={() => setCropOpen(true)}
                                    >
                                        Adjust crop
                                    </Button>
                                )}
                                {draft.photo && (
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            setCropSource(null)
                                            edit((next) => ({
                                                ...next,
                                                photo: '',
                                            }))
                                        }}
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
                            <Dialog
                                open={cropOpen && Boolean(cropSource)}
                                onClose={() => setCropOpen(false)}
                                fullWidth
                                maxWidth="xs"
                            >
                                <DialogTitle>
                                    Position your photo
                                </DialogTitle>
                                <DialogContent>
                                    <div className="about-crop-area">
                                        {cropSource && (
                                            <Cropper
                                                image={cropSource.src}
                                                crop={crop}
                                                zoom={zoom}
                                                aspect={1}
                                                cropShape="round"
                                                showGrid={false}
                                                onCropChange={setCrop}
                                                onZoomChange={setZoom}
                                                onCropComplete={(
                                                    croppedArea,
                                                    croppedAreaPixels
                                                ) => {
                                                    void croppedArea
                                                    setCropArea(
                                                        croppedAreaPixels
                                                    )
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="about-crop-zoom">
                                        <span>Zoom</span>
                                        <Slider
                                            size="small"
                                            min={1}
                                            max={4}
                                            step={0.05}
                                            value={zoom}
                                            onChange={(sliderEvent, value) => {
                                                void sliderEvent
                                                setZoom(value as number)
                                            }}
                                            aria-label="Zoom"
                                        />
                                    </div>
                                    <p className="section-subtitle">
                                        Drag to reposition — pinch or use
                                        the slider to zoom. The circle is
                                        what the page shows.
                                    </p>
                                </DialogContent>
                                <DialogActions>
                                    <Button
                                        onClick={() => setCropOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={applyCrop}
                                    >
                                        Use photo
                                    </Button>
                                </DialogActions>
                            </Dialog>
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
