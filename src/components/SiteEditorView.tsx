import { useEffect, useMemo, useRef, useState } from 'react'
import {
    Button,
    Checkbox,
    IconButton,
    ListItemText,
    MenuItem,
    Tab,
    Tabs,
    TextField,
} from '@mui/material'
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import { Link as RouterLink } from 'react-router-dom'
import type { SectionKey, SiteContent, SubjectOffering } from '../data/siteContent'
import { paths } from '../paths'
import { SortableItem, SortableList } from './SortableList'
import { OfferingsView } from './OfferingsView'

/**
 * The teacher's site editor (REQ-008): every public-page section as a proper
 * form, rows and sections drag-to-reorder, a preview of exactly what a
 * visitor will see — unsaved edits included — and one Publish that goes live
 * with no deploy.
 */

/** How each reorderable section is named in the editor's order list. */
const sectionLabels: Record<SectionKey, string> = {
    hero: 'Hero — the promise and call to action',
    subjects: 'Subjects taught',
    journey: 'How it works',
    approach: 'Why families choose us',
    bio: 'Tutor bio & safeguarding',
    faq: 'FAQ',
    freeform: 'Free-form section',
}

/** A list row needs an identity that survives renames and reorders — the
    array index breaks mid-drag and a name can be blank or duplicated. */
let rowCounter = 0
const newRowKey = () => `row-${++rowCounter}`

/** A subject while being edited: the list fields as free comma-separated
    text, so typing "KS3, GCSE" is never mangled mid-keystroke. */
type SubjectRow = {
    key: string
    name: string
    keyStages: string
    examBoards: string
    modes: string
}

/** A journey step or selling point while being edited. */
type PointRow = { key: string; title: string; detail: string }

type Draft = {
    siteName: string
    hero: SiteContent['hero']
    subjects: SubjectRow[]
    journey: PointRow[]
    approach: PointRow[]
    /** Bio passes through untouched — edited on the About page. */
    bio: SiteContent['bio']
    /** FAQ rows ride the PointRow shape: title = question, detail = answer. */
    faq: PointRow[]
    /** Pricing passes through untouched — edited on its own page. */
    pricing: SiteContent['pricing']
    /** Highlights pass through untouched (REQ-038). */
    highlights: SiteContent['highlights']
    /** The Offerings services checklist, one line per service. */
    servicesText: string
    /** The subject cards' third tag label (default "Delivery"). */
    modesLabel: string
    /** Masthead pill copy — {year} renders live; blank hides it. */
    mastheadPill: string
    /** The phone tab bars (REQ-049): flat page keys + spotlight, one
        pair for visitors, one for the teacher. */
    mobileNavItems: string[]
    mobileNavSpotlight: string
    mobileNavTeacherItems: string[]
    mobileNavTeacherSpotlight: string
    freeform: SiteContent['freeform']
    sectionOrder: SectionKey[]
}

/** The published document, spread into editable rows. */
const toDraft = (content: SiteContent): Draft => ({
    siteName: content.siteName,
    hero: { ...content.hero },
    subjects: content.subjects.map((subject) => ({
        key: newRowKey(),
        name: subject.name,
        keyStages: (subject.keyStages ?? []).join(', '),
        examBoards: (subject.examBoards ?? []).join(', '),
        modes: (subject.modes ?? []).join(', '),
    })),
    journey: content.journey.map((step) => ({ key: newRowKey(), ...step })),
    approach: content.approach.map((point) => ({
        key: newRowKey(),
        ...point,
    })),
    bio: content.bio,
    pricing: content.pricing,
    highlights: content.highlights,
    servicesText: content.services.join('\n'),
    modesLabel: content.modesLabel,
    mastheadPill: content.mastheadPill,
    mobileNavItems: [...content.mobileNav.items],
    mobileNavSpotlight: content.mobileNav.spotlight,
    mobileNavTeacherItems: [...content.mobileNavTeacher.items],
    mobileNavTeacherSpotlight: content.mobileNavTeacher.spotlight,
    faq: content.faq.map((item) => ({
        key: newRowKey(),
        title: item.question,
        detail: item.answer,
    })),
    freeform: { ...content.freeform },
    sectionOrder: [...content.sectionOrder],
})

/** The tab bars' vocabularies (REQ-049 + teacher bar, 2026-08-10). */
const PUBLIC_NAV_OPTIONS: Array<{ key: string; label: string }> = [
    { key: 'home', label: 'Home' },
    { key: 'offerings', label: 'Offerings' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'enquire', label: 'Enquire' },
    { key: 'about', label: 'About' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'faq', label: 'FAQ' },
    { key: 'contact', label: 'Contact' },
]
const TEACHER_NAV_OPTIONS: Array<{ key: string; label: string }> = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'students', label: 'Students' },
    { key: 'scheduling', label: 'Class scheduling' },
    { key: 'payments', label: 'Payment tracker' },
    { key: 'snapshot', label: 'Study snapshot' },
    { key: 'leads', label: 'Leads' },
    { key: 'alumni', label: 'Alumni' },
    { key: 'moderation', label: 'Review moderation' },
    { key: 'editor', label: 'Site editor' },
]

const splitList = (raw: string): string[] =>
    raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

/** The draft back into a publishable document. Blank rows are dropped and an
    empty spec list is omitted, so a round trip of an untouched document is
    byte-identical — that comparison is what arms the Publish button. */
const assemble = (draft: Draft): SiteContent => ({
    siteName: draft.siteName.trim(),
    hero: draft.hero,
    subjects: draft.subjects
        .filter((row) => row.name.trim())
        .map((row) => {
            const subject: SubjectOffering = { name: row.name.trim() }
            const keyStages = splitList(row.keyStages)
            const examBoards = splitList(row.examBoards)
            const modes = splitList(row.modes)
            if (keyStages.length) {
                subject.keyStages = keyStages
            }
            if (examBoards.length) {
                subject.examBoards = examBoards
            }
            if (modes.length) {
                subject.modes = modes
            }
            return subject
        }),
    journey: draft.journey
        .filter((row) => row.title.trim() || row.detail.trim())
        .map((row) => ({ title: row.title.trim(), detail: row.detail })),
    approach: draft.approach
        .filter((row) => row.title.trim() || row.detail.trim())
        .map((row) => ({ title: row.title.trim(), detail: row.detail })),
    bio: draft.bio,
    pricing: draft.pricing,
    highlights: draft.highlights,
    services: draft.servicesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    modesLabel: draft.modesLabel.trim() || 'Delivery',
    mastheadPill: draft.mastheadPill.trim(),
    mobileNav: {
        items: draft.mobileNavItems.slice(0, 3),
        spotlight: draft.mobileNavSpotlight || 'enquire',
    },
    mobileNavTeacher: {
        items: draft.mobileNavTeacherItems.slice(0, 3),
        spotlight: draft.mobileNavTeacherSpotlight || 'payments',
    },
    // Both halves required: the API rejects a question without an answer,
    // so an incomplete row is dropped rather than failing the publish.
    faq: draft.faq
        .filter((row) => row.title.trim() && row.detail.trim())
        .map((row) => ({
            question: row.title.trim(),
            answer: row.detail.trim(),
        })),
    freeform: draft.freeform,
    sectionOrder: draft.sectionOrder,
})

type SiteEditorViewProps = {
    /** The published document — the editor's baseline. */
    content: SiteContent
    /** A publish is in flight. */
    publishing: boolean
    onPublish: (content: SiteContent) => void
}

export const SiteEditorView = ({
    content,
    publishing,
    onPublish,
}: SiteEditorViewProps) => {
    const [tab, setTab] = useState<'edit' | 'preview'>('edit')
    const [draft, setDraft] = useState<Draft>(() => toDraft(content))
    // Once anything is edited, a document landing from the API (the route's
    // fetch, a background refresh) must not clobber the teacher's work —
    // only Discard re-syncs. Until then, adopt what the fetch brings.
    const touched = useRef(false)
    useEffect(() => {
        if (!touched.current) {
            setDraft(toDraft(content))
        }
    }, [content])

    const edit = (mutate: (next: Draft) => void) => {
        touched.current = true
        setDraft((current) => {
            const next = structuredClone(current)
            mutate(next)
            return next
        })
    }

    const discard = () => {
        touched.current = false
        setDraft(toDraft(content))
    }

    const assembled = useMemo(() => assemble(draft), [draft])
    // Normalised on both sides, so field order and editing round trips can't
    // fake a difference.
    const dirty = useMemo(
        () =>
            JSON.stringify(assembled) !==
            JSON.stringify(assemble(toDraft(content))),
        [assembled, content]
    )

    // The two fields the public page cannot render meaningfully without.
    const siteNameMissing = !draft.siteName.trim()
    const headlineMissing = !draft.hero.headline.trim()

    const editSubject = (
        key: string,
        field: 'name' | 'keyStages' | 'examBoards' | 'modes',
        value: string
    ) =>
        edit((next) => {
            const row = next.subjects.find((item) => item.key === key)
            if (row) {
                row[field] = value
            }
        })

    const editPoint = (
        list: 'journey' | 'approach' | 'faq',
        key: string,
        field: 'title' | 'detail',
        value: string
    ) =>
        edit((next) => {
            const row = next[list].find((item) => item.key === key)
            if (row) {
                row[field] = value
            }
        })

    const pointsCard = (
        list: 'journey' | 'approach' | 'faq',
        heading: string,
        subtitle: string,
        noun: string,
        labels: { title: string; detail: string } = {
            title: 'Title',
            detail: 'Detail',
        }
    ) => (
        <details className="card editor-accordion">
            <summary className="editor-accordion-summary">
                <h4 className="offerings-heading">{heading}</h4>
                <ExpandMoreRoundedIcon className="editor-accordion-chevron" fontSize="small" />
            </summary>
            <div className="section-header">
                <div>
                    
                    <p className="section-subtitle">{subtitle}</p>
                </div>
                <Button
                    size="small"
                    startIcon={<AddRoundedIcon fontSize="small" />}
                    onClick={() =>
                        edit((next) => {
                            next[list].push({
                                key: newRowKey(),
                                title: '',
                                detail: '',
                            })
                        })
                    }
                >
                    Add {noun}
                </Button>
            </div>
            <SortableList
                ids={draft[list].map((row) => row.key)}
                onReorder={(ids) =>
                    edit((next) => {
                        next[list] = ids.map(
                            (id) =>
                                next[list].find((row) => row.key === id) as PointRow
                        )
                    })
                }
            >
                <div className="sortable-rows">
                    {draft[list].map((row) => (
                        <SortableItem
                            key={row.key}
                            id={row.key}
                            label={`Reorder ${row.title || `new ${noun}`}`}
                        >
                            <div className="site-editor-point-row">
                                <TextField
                                    label={labels.title}
                                    size="small"
                                    value={row.title}
                                    onChange={(event) =>
                                        editPoint(
                                            list,
                                            row.key,
                                            'title',
                                            event.target.value
                                        )
                                    }
                                />
                                <TextField
                                    label={labels.detail}
                                    size="small"
                                    multiline
                                    value={row.detail}
                                    onChange={(event) =>
                                        editPoint(
                                            list,
                                            row.key,
                                            'detail',
                                            event.target.value
                                        )
                                    }
                                />
                                <IconButton
                                    size="small"
                                    aria-label={`Remove ${row.title || `new ${noun}`}`}
                                    onClick={() =>
                                        edit((next) => {
                                            next[list] = next[list].filter(
                                                (item) => item.key !== row.key
                                            )
                                        })
                                    }
                                >
                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                            </div>
                        </SortableItem>
                    ))}
                </div>
            </SortableList>
        </details>
    )

    return (
        <section className="content-stack">
            {/* Sticky on desktop: the long form scrolls, Publish never
                leaves sight. */}
            <div className="card site-editor-header">
                <div className="section-header">
                    <div>
                        <h3 className="page-heading">
                            <LanguageOutlinedIcon fontSize="small" />
                            Public site
                        </h3>
                        <p className="section-subtitle">
                            Edit what visitors read on the public pages,
                            preview it, and publish — live at once, no deploy.
                        </p>
                    </div>
                    <div className="site-editor-actions">
                        {dirty && (
                            <Button onClick={discard} disabled={publishing}>
                                Discard changes
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            disabled={
                                publishing ||
                                !dirty ||
                                siteNameMissing ||
                                headlineMissing
                            }
                            onClick={() => onPublish(assembled)}
                        >
                            {publishing ? 'Publishing…' : 'Publish'}
                        </Button>
                    </div>
                </div>
                <Tabs
                    value={tab}
                    onChange={(_, next: 'edit' | 'preview') => setTab(next)}
                >
                    <Tab value="edit" label="Edit" />
                    <Tab value="preview" label="Preview" />
                </Tabs>
            </div>

            {tab === 'preview' ? (
                <>
                    <p className="site-editor-preview-note">
                        The Offerings page exactly as a visitor will see it —
                        including your unsaved changes.
                    </p>
                    <OfferingsView
                        content={assembled}
                        onBookAssessment={() => undefined}
                    />
                </>
            ) : (
                <>
                    <details className="card editor-accordion">
                        <summary className="editor-accordion-summary">
                            <h4 className="offerings-heading">Page sections</h4>
                            <ExpandMoreRoundedIcon className="editor-accordion-chevron" fontSize="small" />
                        </summary>
                        
                        <p className="section-subtitle">
                            Drag to choose the order sections appear on the
                            Offerings page.
                        </p>
                        {/* 'faq' stays in the published sectionOrder (the
                            API validates a full permutation) but has no chip:
                            the FAQ lives on its own page now, so there is
                            nothing to order on Offerings. */}
                        <SortableList
                            ids={draft.sectionOrder.filter(
                                (key) =>
                                    key !== 'faq' &&
                                    key !== 'journey' &&
                                    key !== 'bio'
                            )}
                            onReorder={(ids) =>
                                edit((next) => {
                                    next.sectionOrder = [
                                        ...(ids as SectionKey[]),
                                        'bio',
                                        'journey',
                                        'faq',
                                    ]
                                })
                            }
                        >
                            <div className="sortable-rows">
                                {draft.sectionOrder
                                    .filter(
                                        (key) =>
                                            key !== 'faq' &&
                                            key !== 'journey' &&
                                            key !== 'bio'
                                    )
                                    .map((key) => (
                                        <SortableItem
                                            key={key}
                                            id={key}
                                            label={`Reorder ${sectionLabels[key]}`}
                                        >
                                            <span className="site-editor-section-name">
                                                {sectionLabels[key]}
                                            </span>
                                        </SortableItem>
                                    ))}
                            </div>
                        </SortableList>
                    </details>

                    <details className="card editor-accordion">
                        <summary className="editor-accordion-summary">
                            <h4 className="offerings-heading">Site name &amp; hero</h4>
                            <ExpandMoreRoundedIcon className="editor-accordion-chevron" fontSize="small" />
                        </summary>
                        
                        <div className="site-editor-fields">
                            <TextField
                                label="Site name"
                                size="small"
                                required
                                value={draft.siteName}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.siteName = event.target.value
                                    })
                                }
                                error={siteNameMissing}
                                helperText={
                                    siteNameMissing
                                        ? 'Required — headings like “Why families choose …” use it.'
                                        : 'Used in headings like “Why families choose …”.'
                                }
                            />
                            <TextField
                                label="Headline"
                                size="small"
                                required
                                multiline
                                value={draft.hero.headline}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.hero.headline = event.target.value
                                    })
                                }
                                error={headlineMissing}
                                helperText={
                                    headlineMissing
                                        ? 'Required.'
                                        : 'Press Enter where phones should break the line — desktop keeps it on one line.'
                                }
                            />
                            <TextField
                                label="Sub-headline"
                                size="small"
                                multiline
                                value={draft.hero.subhead}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.hero.subhead = event.target.value
                                    })
                                }
                            />
                            <TextField
                                label="Availability line"
                                size="small"
                                value={draft.hero.availability}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.hero.availability =
                                            event.target.value
                                    })
                                }
                                helperText="e.g. “Now taking Year 10 & 11 students”. Leave blank to hide it."
                            />
                            <TextField
                                label="Masthead pill"
                                size="small"
                                value={draft.mastheadPill}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.mastheadPill =
                                            event.target.value
                                    })
                                }
                                helperText="The little badge in the top bar. {year} shows the current year. Leave blank to hide it."
                            />
                            <TextField
                                label="Years of tutoring experience"
                                size="small"
                                type="number"
                                slotProps={{
                                    htmlInput: { min: 0, max: 99 },
                                }}
                                value={draft.hero.experienceYears || ''}
                                onChange={(event) =>
                                    edit((next) => {
                                        const years = Number(
                                            event.target.value
                                        )
                                        next.hero.experienceYears =
                                            Number.isFinite(years) && years > 0
                                                ? Math.floor(years)
                                                : undefined
                                    })
                                }
                                helperText="Shown on the Home page as “20+ years of tutoring experience”. Leave blank to hide it."
                            />
                        </div>
                    </details>

                    <details className="card editor-accordion">
                        <summary className="editor-accordion-summary">
                            <h4 className="offerings-heading">Subjects taught</h4>
                            <ExpandMoreRoundedIcon className="editor-accordion-chevron" fontSize="small" />
                        </summary>
                        <div className="section-header">
                            <div>
                                
                                <p className="section-subtitle">
                                    Tag values are comma-separated. A subject
                                    with no name is dropped when you publish.
                                </p>
                            </div>
                            <Button
                                size="small"
                                startIcon={<AddRoundedIcon fontSize="small" />}
                                onClick={() =>
                                    edit((next) => {
                                        next.subjects.push({
                                            key: newRowKey(),
                                            name: '',
                                            keyStages: '',
                                            examBoards: '',
                                            modes: '',
                                        })
                                    })
                                }
                            >
                                Add subject
                            </Button>
                        </div>
                        <div className="site-editor-fields">
                            {/* The third tag's NAME is the owner's to pick
                                (2026-08-09) — "Delivery" today,
                                "Experience" tomorrow, without a deploy. */}
                            <TextField
                                label="Third tag label"
                                size="small"
                                value={draft.modesLabel}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.modesLabel = event.target.value
                                    })
                                }
                                helperText='Names the third tag on every subject card — e.g. "Delivery" or "Experience". Blank falls back to "Delivery".'
                            />
                        </div>
                        <SortableList
                            ids={draft.subjects.map((row) => row.key)}
                            onReorder={(ids) =>
                                edit((next) => {
                                    next.subjects = ids.map(
                                        (id) =>
                                            next.subjects.find(
                                                (row) => row.key === id
                                            ) as SubjectRow
                                    )
                                })
                            }
                        >
                            <div className="sortable-rows">
                                {draft.subjects.map((row) => (
                                    <SortableItem
                                        key={row.key}
                                        id={row.key}
                                        label={`Reorder ${row.name || 'new subject'}`}
                                    >
                                        <div className="site-editor-row">
                                            <TextField
                                                label="Subject"
                                                size="small"
                                                value={row.name}
                                                onChange={(event) =>
                                                    editSubject(
                                                        row.key,
                                                        'name',
                                                        event.target.value
                                                    )
                                                }
                                            />
                                            <TextField
                                                label="Levels"
                                                size="small"
                                                placeholder="KS3, GCSE, A-level"
                                                value={row.keyStages}
                                                onChange={(event) =>
                                                    editSubject(
                                                        row.key,
                                                        'keyStages',
                                                        event.target.value
                                                    )
                                                }
                                            />
                                            <TextField
                                                label="Exam boards"
                                                size="small"
                                                placeholder="AQA, Edexcel"
                                                value={row.examBoards}
                                                onChange={(event) =>
                                                    editSubject(
                                                        row.key,
                                                        'examBoards',
                                                        event.target.value
                                                    )
                                                }
                                            />
                                            <TextField
                                                label={
                                                    draft.modesLabel.trim() ||
                                                    'Delivery'
                                                }
                                                size="small"
                                                placeholder="Online, In person"
                                                value={row.modes}
                                                onChange={(event) =>
                                                    editSubject(
                                                        row.key,
                                                        'modes',
                                                        event.target.value
                                                    )
                                                }
                                            />
                                            <IconButton
                                                size="small"
                                                aria-label={`Remove ${row.name || 'new subject'}`}
                                                onClick={() =>
                                                    edit((next) => {
                                                        next.subjects =
                                                            next.subjects.filter(
                                                                (item) =>
                                                                    item.key !==
                                                                    row.key
                                                            )
                                                    })
                                                }
                                            >
                                                <DeleteOutlineRoundedIcon fontSize="small" />
                                            </IconButton>
                                        </div>
                                    </SortableItem>
                                ))}
                            </div>
                        </SortableList>
                    </details>

                    {pointsCard(
                        'journey',
                        'How it works',
                        'The steps from first enquiry to weekly lessons — shown on the Home page.',
                        'step'
                    )}
                    {pointsCard(
                        'approach',
                        `Why families choose ${draft.siteName.trim() || 'us'}`,
                        'The selling points, each a short claim with the detail behind it.',
                        'selling point'
                    )}

                    <details className="card editor-accordion">
                        <summary className="editor-accordion-summary">
                            <h4 className="offerings-heading">What we offer</h4>
                            <ExpandMoreRoundedIcon className="editor-accordion-chevron" fontSize="small" />
                        </summary>
                        
                        <p className="section-subtitle">
                            The services checklist on the Offerings page —
                            one per line, ticks added automatically.
                        </p>
                        <TextField
                            label="Services — one per line"
                            size="small"
                            multiline
                            minRows={6}
                            value={draft.servicesText}
                            onChange={(event) =>
                                edit((next) => {
                                    next.servicesText = event.target.value
                                })
                            }
                        />
                    </details>

                    <details className="card editor-accordion">
                        <summary className="editor-accordion-summary">
                            <h4 className="offerings-heading">Phone tab bar — visitors</h4>
                            <ExpandMoreRoundedIcon className="editor-accordion-chevron" fontSize="small" />
                        </summary>
                        <p className="section-subtitle">
                            The bar visitors see along the bottom on phones
                            (REQ-049). Up to three pages plus the raised
                            spotlight; Menu is always the fifth tab.
                            Contact hides itself while no contact details
                            are published.
                        </p>
                        <div className="site-editor-fields">
                            <TextField
                                select
                                label="Visitor pages (up to 3, in order)"
                                size="small"
                                value={draft.mobileNavItems}
                                slotProps={{
                                    select: {
                                        multiple: true,
                                        renderValue: (selected) =>
                                            (selected as string[])
                                                .map(
                                                    (key) =>
                                                        PUBLIC_NAV_OPTIONS.find(
                                                            (option) =>
                                                                option.key ===
                                                                key
                                                        )?.label ?? key
                                                )
                                                .join(', '),
                                    },
                                }}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.mobileNavItems = (
                                            event.target
                                                .value as unknown as string[]
                                        ).slice(0, 3)
                                    })
                                }
                            >
                                {PUBLIC_NAV_OPTIONS.map((option) => (
                                    <MenuItem
                                        key={option.key}
                                        value={option.key}
                                        disabled={
                                            draft.mobileNavItems.length >=
                                                3 &&
                                            !draft.mobileNavItems.includes(
                                                option.key
                                            )
                                        }
                                    >
                                        <Checkbox
                                            checked={draft.mobileNavItems.includes(
                                                option.key
                                            )}
                                        />
                                        <ListItemText
                                            primary={option.label}
                                        />
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                label="Visitor spotlight (raised centre tab)"
                                size="small"
                                value={draft.mobileNavSpotlight}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.mobileNavSpotlight =
                                            event.target.value
                                    })
                                }
                            >
                                {PUBLIC_NAV_OPTIONS.map((option) => (
                                    <MenuItem
                                        key={option.key}
                                        value={option.key}
                                    >
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </div>
                    </details>

                    <details className="card editor-accordion">
                        <summary className="editor-accordion-summary">
                            <h4 className="offerings-heading">Phone tab bar — teacher</h4>
                            <ExpandMoreRoundedIcon className="editor-accordion-chevron" fontSize="small" />
                        </summary>
                        <p className="section-subtitle">
                            Your own bar when signed in on a phone — the
                            work screens you use most, with the drawer
                            behind Menu for the rest.
                        </p>
                        <div className="site-editor-fields">
                            <TextField
                                select
                                label="Teacher pages (up to 3, in order)"
                                size="small"
                                value={draft.mobileNavTeacherItems}
                                slotProps={{
                                    select: {
                                        multiple: true,
                                        renderValue: (selected) =>
                                            (selected as string[])
                                                .map(
                                                    (key) =>
                                                        TEACHER_NAV_OPTIONS.find(
                                                            (option) =>
                                                                option.key ===
                                                                key
                                                        )?.label ?? key
                                                )
                                                .join(', '),
                                    },
                                }}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.mobileNavTeacherItems = (
                                            event.target
                                                .value as unknown as string[]
                                        ).slice(0, 3)
                                    })
                                }
                            >
                                {TEACHER_NAV_OPTIONS.map((option) => (
                                    <MenuItem
                                        key={option.key}
                                        value={option.key}
                                        disabled={
                                            draft.mobileNavTeacherItems
                                                .length >= 3 &&
                                            !draft.mobileNavTeacherItems.includes(
                                                option.key
                                            )
                                        }
                                    >
                                        <Checkbox
                                            checked={draft.mobileNavTeacherItems.includes(
                                                option.key
                                            )}
                                        />
                                        <ListItemText
                                            primary={option.label}
                                        />
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                label="Teacher spotlight (raised centre tab)"
                                size="small"
                                value={draft.mobileNavTeacherSpotlight}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.mobileNavTeacherSpotlight =
                                            event.target.value
                                    })
                                }
                            >
                                {TEACHER_NAV_OPTIONS.map((option) => (
                                    <MenuItem
                                        key={option.key}
                                        value={option.key}
                                    >
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </div>
                    </details>

                    <details className="card editor-accordion">
                        <summary className="editor-accordion-summary">
                            <h4 className="offerings-heading">About the teacher</h4>
                            <ExpandMoreRoundedIcon className="editor-accordion-chevron" fontSize="small" />
                        </summary>
                        
                        <p className="section-subtitle">
                            The bio, CV, expectations and safeguarding are
                            edited on the About page itself.
                        </p>
                        <Button
                            size="small"
                            variant="outlined"
                            component={RouterLink}
                            to={paths.about}
                        >
                            Open the About page
                        </Button>
                    </details>

                    {/* FAQ editing moved to the FAQ page itself (owner
                        call, 2026-08-04) — publishes from here pass the
                        stored entries through untouched. */}
                    <details className="card editor-accordion">
                        <summary className="editor-accordion-summary">
                            <h4 className="offerings-heading">FAQ</h4>
                            <ExpandMoreRoundedIcon className="editor-accordion-chevron" fontSize="small" />
                        </summary>
                        
                        <p className="section-subtitle">
                            The FAQ is edited on its own page now — questions,
                            answers and publishing all live there.
                        </p>
                        <Button
                            size="small"
                            variant="outlined"
                            component={RouterLink}
                            to={paths.faq}
                        >
                            Open the FAQ page
                        </Button>
                    </details>

                    <details className="card editor-accordion">
                        <summary className="editor-accordion-summary">
                            <h4 className="offerings-heading">Pricing</h4>
                            <ExpandMoreRoundedIcon className="editor-accordion-chevron" fontSize="small" />
                        </summary>
                        
                        <p className="section-subtitle">
                            Rates, factors and the closing note are edited on
                            the pricing page itself.
                        </p>
                        <Button
                            size="small"
                            variant="outlined"
                            component={RouterLink}
                            to={paths.pricing}
                        >
                            Open the pricing page
                        </Button>
                    </details>

                    <details className="card editor-accordion">
                        <summary className="editor-accordion-summary">
                            <h4 className="offerings-heading">Free-form section</h4>
                            <ExpandMoreRoundedIcon className="editor-accordion-chevron" fontSize="small" />
                        </summary>
                        
                        <p className="section-subtitle">
                            For anything without a field of its own — a
                            notice, term dates. Shows as the pinned note at
                            the top of the Home page (owner call,
                            2026-08-10). Leave both blank to hide it.
                        </p>
                        <div className="site-editor-fields">
                            <TextField
                                label="Heading"
                                size="small"
                                value={draft.freeform.heading}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.freeform.heading =
                                            event.target.value
                                    })
                                }
                            />
                            <TextField
                                label="Body (Markdown)"
                                size="small"
                                multiline
                                minRows={6}
                                value={draft.freeform.markdown}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.freeform.markdown =
                                            event.target.value
                                    })
                                }
                                helperText="Markdown: ### headings, **bold**, *italic*, - lists and [links](https://…). Raw HTML is stripped when you publish."
                            />
                        </div>
                    </details>
                </>
            )}
        </section>
    )
}
