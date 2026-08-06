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

/** A dated CV list — quiet years column, title, place, one-line detail. */
const CvList = ({ heading, entries }: { heading: string; entries: CvEntry[] }) =>
    entries.length > 0 ? (
        <div className="about-cv-block">
            <h4 className="offerings-heading">{heading}</h4>
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
        </div>
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
    const empty =
        !bio.heading &&
        !bio.body &&
        bio.qualifications.length === 0 &&
        bio.experience.length === 0

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
                            {bio.heading || 'About the teacher'}
                        </h3>
                    </div>
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

                {bio.body && (
                    <div className="about-intro">
                        {renderMarkdown(bio.body)}
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

                {bio.qualifications.length > 0 && (
                    <div className="about-quals">
                        {bio.qualifications.map((line) => (
                            <span key={line} className="about-qual-pill">
                                {line}
                            </span>
                        ))}
                    </div>
                )}

                <CvList heading="Teaching experience" entries={bio.experience} />
                <CvList heading="Education" entries={bio.education} />

                {bio.expectations.length > 0 && (
                    <div className="about-cv-block">
                        <h4 className="offerings-heading">
                            What you can expect
                        </h4>
                        <ul className="about-expectations">
                            {bio.expectations.map((line) => (
                                <li key={line}>
                                    <CheckCircleRoundedIcon fontSize="small" />
                                    {line}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {bio.sections.map((section) => (
                    <div key={section.heading} className="about-cv-block">
                        {section.heading && (
                            <h4 className="offerings-heading">
                                {section.heading}
                            </h4>
                        )}
                        <div className="about-section-body">
                            {renderMarkdown(section.markdown)}
                        </div>
                    </div>
                ))}

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
