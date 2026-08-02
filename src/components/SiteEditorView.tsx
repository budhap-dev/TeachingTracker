import { useEffect, useMemo, useRef, useState } from 'react'
import {
    Button,
    Checkbox,
    FormControlLabel,
    IconButton,
    Tab,
    Tabs,
    TextField,
} from '@mui/material'
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import type { SectionKey, SiteContent, SubjectOffering } from '../data/siteContent'
import { defaultSiteContent } from '../data/siteContent'
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

/** The bio while being edited: qualifications as one-per-line text. */
type BioDraft = {
    heading: string
    body: string
    qualificationsText: string
    dbsChecked: boolean
    safeguarding: string
}

type Draft = {
    siteName: string
    hero: SiteContent['hero']
    subjects: SubjectRow[]
    journey: PointRow[]
    approach: PointRow[]
    bio: BioDraft
    /** FAQ rows ride the PointRow shape: title = question, detail = answer. */
    faq: PointRow[]
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
    bio: {
        heading: content.bio.heading,
        body: content.bio.body,
        qualificationsText: content.bio.qualifications.join('\n'),
        dbsChecked: content.bio.dbsChecked,
        safeguarding: content.bio.safeguarding,
    },
    faq: content.faq.map((item) => ({
        key: newRowKey(),
        title: item.question,
        detail: item.answer,
    })),
    freeform: { ...content.freeform },
    sectionOrder: [...content.sectionOrder],
})

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
    bio: {
        heading: draft.bio.heading.trim(),
        body: draft.bio.body,
        qualifications: draft.bio.qualificationsText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
        dbsChecked: draft.bio.dbsChecked,
        safeguarding: draft.bio.safeguarding.trim(),
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
        <div className="card">
            <div className="section-header">
                <div>
                    <h4 className="offerings-heading">{heading}</h4>
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
        </div>
    )

    return (
        <section className="content-stack">
            <div className="card">
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
                    <div className="card">
                        <h4 className="offerings-heading">Page sections</h4>
                        <p className="section-subtitle">
                            Drag to choose the order sections appear on the
                            Offerings page.
                        </p>
                        <SortableList
                            ids={draft.sectionOrder}
                            onReorder={(ids) =>
                                edit((next) => {
                                    next.sectionOrder = ids as SectionKey[]
                                })
                            }
                        >
                            <div className="sortable-rows">
                                {draft.sectionOrder.map((key) => (
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
                    </div>

                    <div className="card">
                        <h4 className="offerings-heading">
                            Site name &amp; hero
                        </h4>
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
                                value={draft.hero.headline}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.hero.headline = event.target.value
                                    })
                                }
                                error={headlineMissing}
                                helperText={
                                    headlineMissing ? 'Required.' : undefined
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
                    </div>

                    <div className="card">
                        <div className="section-header">
                            <div>
                                <h4 className="offerings-heading">
                                    Subjects taught
                                </h4>
                                <p className="section-subtitle">
                                    Levels, exam boards and delivery are
                                    comma-separated. A subject with no name is
                                    dropped when you publish.
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
                                                label="Delivery"
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
                    </div>

                    {pointsCard(
                        'journey',
                        'How it works',
                        'The steps from first enquiry to weekly lessons.',
                        'step'
                    )}
                    {pointsCard(
                        'approach',
                        `Why families choose ${draft.siteName.trim() || 'us'}`,
                        'The selling points, each a short claim with the detail behind it.',
                        'selling point'
                    )}

                    <div className="card">
                        <h4 className="offerings-heading">
                            Tutor bio &amp; safeguarding
                        </h4>
                        <p className="section-subtitle">
                            Who you are, your qualifications, and the
                            safeguarding facts parents look for. Leave it all
                            blank to hide the section — the DBS badge shows
                            only when you tick it.
                        </p>
                        <div className="site-editor-fields">
                            <TextField
                                label="Bio heading"
                                size="small"
                                value={draft.bio.heading}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.bio.heading = event.target.value
                                    })
                                }
                                helperText="e.g. “Meet your tutor”."
                            />
                            <TextField
                                label="About you (Markdown)"
                                size="small"
                                multiline
                                minRows={4}
                                value={draft.bio.body}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.bio.body = event.target.value
                                    })
                                }
                                helperText="Who you are, how long you've taught, what you believe about teaching."
                            />
                            <TextField
                                label="Qualifications — one per line"
                                size="small"
                                multiline
                                minRows={3}
                                value={draft.bio.qualificationsText}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.bio.qualificationsText =
                                            event.target.value
                                    })
                                }
                                helperText="Each line becomes a pill, e.g. “PGCE, Secondary Mathematics”."
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={draft.bio.dbsChecked}
                                        onChange={(event) =>
                                            edit((next) => {
                                                next.bio.dbsChecked =
                                                    event.target.checked
                                            })
                                        }
                                    />
                                }
                                label="Show the “Enhanced DBS checked” badge — tick only if your certificate is current"
                            />
                            <TextField
                                label="Safeguarding statement"
                                size="small"
                                multiline
                                value={draft.bio.safeguarding}
                                onChange={(event) =>
                                    edit((next) => {
                                        next.bio.safeguarding =
                                            event.target.value
                                    })
                                }
                                helperText="A short line on how lessons are kept safe — parents in the loop, records kept, and so on."
                            />
                        </div>
                    </div>

                    {pointsCard(
                        'faq',
                        'FAQ',
                        'The questions families ask, each with your answer. An entry missing either half is left out when you publish.',
                        'question',
                        { title: 'Question', detail: 'Answer' }
                    )}
                    {draft.faq.length === 0 && (
                        <div className="card site-editor-faq-starter">
                            <p className="section-subtitle">
                                Not sure where to begin? Load the suggested
                                questions and edit them to fit — nothing goes
                                live until you publish.
                            </p>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() =>
                                    edit((next) => {
                                        next.faq = defaultSiteContent.faq.map(
                                            (item) => ({
                                                key: newRowKey(),
                                                title: item.question,
                                                detail: item.answer,
                                            })
                                        )
                                    })
                                }
                            >
                                Add the starter questions
                            </Button>
                        </div>
                    )}

                    <div className="card">
                        <h4 className="offerings-heading">
                            Free-form section
                        </h4>
                        <p className="section-subtitle">
                            For anything without a field of its own — an
                            about, a notice, term dates. Leave both blank to
                            hide the section.
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
                    </div>
                </>
            )}
        </section>
    )
}
