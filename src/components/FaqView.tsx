import { useEffect, useState } from 'react'
import { Button, IconButton, TextField } from '@mui/material'
import { Link } from 'react-router-dom'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import { useIsAuthenticated } from '@azure/msal-react'
import { isAuthConfigured } from '../auth/msal'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
    fetchSiteContentRequested,
    publishSiteContentRequested,
} from '../store/store'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { defaultSiteContent } from '../data/siteContent'
import type { FaqItem, SiteContent } from '../data/siteContent'
import { SortableItem, SortableList } from './SortableList'
import { paths } from '../paths'
import { PageLoading } from './PageLoading'

/** A FAQ row while being edited — keyed so reorders survive renames. */
type FaqRow = { key: string; question: string; answer: string }

let rowCounter = 0
const newRowKey = () => `faq-row-${++rowCounter}`

const toRows = (faq: FaqItem[]): FaqRow[] =>
    faq.map((item) => ({ key: newRowKey(), ...item }))

/** Rows back into publishable entries; half-filled rows are left out. */
const assemble = (rows: FaqRow[]): FaqItem[] =>
    rows
        .map((row) => ({
            question: row.question.trim(),
            answer: row.answer.trim(),
        }))
        .filter((item) => item.question.length > 0 && item.answer.length > 0)

type FaqViewProps = {
    /** The published document — the page renders its `faq`, and a publish
        sends the whole document back with only `faq` changed. */
    content: SiteContent
    /** True for the signed-in teacher (or auth-less local dev): the page
        becomes its own editor (owner call — FAQ edits live HERE, not in
        the site editor). */
    canEdit: boolean
    publishing: boolean
    onPublish: (content: SiteContent) => void
}

/**
 * The FAQ as its own page (owner call, 2026-08-04): the accordion for
 * visitors, with the enquiry CTA closing it — and for the teacher, inline
 * editing on the same page: rows, reorder, the starter set, one Publish.
 */
export const FaqView = ({
    content,
    canEdit,
    publishing,
    onPublish,
}: FaqViewProps) => {
    useDocumentMeta(
        'FAQ — AbhiTutor',
        'Answers to the questions families ask about tutoring with AbhiTutor — subjects, levels, online and in-person lessons, and how to get started.'
    )
    const [rows, setRows] = useState<FaqRow[]>(() => toRows(content.faq))
    // Adopt refreshed content until the teacher's first edit — then the
    // draft is theirs (same stance as the site editor).
    const [edited, setEdited] = useState(false)
    useEffect(() => {
        if (!edited) {
            setRows(toRows(content.faq))
        }
    }, [content.faq, edited])

    const change = (mutate: (next: FaqRow[]) => FaqRow[]) => {
        setEdited(true)
        setRows((current) => mutate(current))
    }

    const assembled = assemble(rows)
    const dirty =
        JSON.stringify(assembled) !== JSON.stringify(content.faq)

    return (
        <section className="content-stack faq-page">
            <div className="card">
                <div className="section-header">
                    <div>
                        <h3 className="page-heading">
                            <QuizOutlinedIcon fontSize="small" />
                            Questions families ask
                        </h3>
                        <p className="section-subtitle">
                            Straight answers about subjects, lessons and how
                            to get started.
                        </p>
                    </div>
                    {canEdit && (
                        <Button
                            variant="contained"
                            disabled={publishing || !dirty}
                            onClick={() =>
                                onPublish({ ...content, faq: assembled })
                            }
                        >
                            {publishing ? 'Publishing…' : 'Publish FAQ'}
                        </Button>
                    )}
                </div>

                {content.faq.length === 0 && !canEdit && (
                    <p className="section-subtitle">
                        No questions published yet — ask us directly below.
                    </p>
                )}
                {content.faq.length > 0 && (
                    <div className="faq-list">
                        {content.faq.map((item) => (
                            <details key={item.question} className="faq-item">
                                <summary>{item.question}</summary>
                                <p>{item.answer}</p>
                            </details>
                        ))}
                    </div>
                )}

                <div className="faq-cta">
                    <Button
                        variant="outlined"
                        component={Link}
                        to={paths.enquire}
                    >
                        Ask us — request a free assessment
                    </Button>
                </div>
            </div>

            {canEdit && (
                <div className="card">
                    <div className="section-header">
                        <div>
                            <h4 className="offerings-heading">
                                Edit the FAQ
                            </h4>
                            <p className="section-subtitle">
                                Changes publish from this page — the site
                                editor no longer carries a FAQ section. An
                                entry missing either half is left out when
                                you publish.
                            </p>
                        </div>
                        <Button
                            size="small"
                            startIcon={<AddRoundedIcon fontSize="small" />}
                            onClick={() =>
                                change((current) => [
                                    ...current,
                                    {
                                        key: newRowKey(),
                                        question: '',
                                        answer: '',
                                    },
                                ])
                            }
                        >
                            Add question
                        </Button>
                    </div>
                    <SortableList
                        ids={rows.map((row) => row.key)}
                        onReorder={(ids) =>
                            change((current) =>
                                ids.map(
                                    (id) =>
                                        current.find(
                                            (row) => row.key === id
                                        ) as FaqRow
                                )
                            )
                        }
                    >
                        <div className="sortable-rows">
                            {rows.map((row) => (
                                <SortableItem
                                    key={row.key}
                                    id={row.key}
                                    label={`Reorder ${row.question || 'new question'}`}
                                >
                                    <div className="site-editor-point-row">
                                        <TextField
                                            label="Question"
                                            size="small"
                                            value={row.question}
                                            onChange={(event) =>
                                                change((current) =>
                                                    current.map((item) =>
                                                        item.key === row.key
                                                            ? {
                                                                  ...item,
                                                                  question:
                                                                      event
                                                                          .target
                                                                          .value,
                                                              }
                                                            : item
                                                    )
                                                )
                                            }
                                        />
                                        <TextField
                                            label="Answer"
                                            size="small"
                                            multiline
                                            value={row.answer}
                                            onChange={(event) =>
                                                change((current) =>
                                                    current.map((item) =>
                                                        item.key === row.key
                                                            ? {
                                                                  ...item,
                                                                  answer: event
                                                                      .target
                                                                      .value,
                                                              }
                                                            : item
                                                    )
                                                )
                                            }
                                        />
                                        <IconButton
                                            size="small"
                                            aria-label={`Remove ${row.question || 'new question'}`}
                                            onClick={() =>
                                                change((current) =>
                                                    current.filter(
                                                        (item) =>
                                                            item.key !==
                                                            row.key
                                                    )
                                                )
                                            }
                                        >
                                            <DeleteOutlineRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </div>
                                </SortableItem>
                            ))}
                        </div>
                    </SortableList>
                    {rows.length === 0 && (
                        <div className="site-editor-faq-starter">
                            <p className="section-subtitle">
                                Not sure where to begin? Load the suggested
                                questions and edit them to fit — nothing goes
                                live until you publish.
                            </p>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() =>
                                    change(() =>
                                        toRows(defaultSiteContent.faq)
                                    )
                                }
                            >
                                Add the starter questions
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </section>
    )
}

const FaqConnected = ({ canEdit }: { canEdit: boolean }) => {
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
        <FaqView
            content={content}
            canEdit={canEdit}
            publishing={publishing}
            onPublish={(next) => dispatch(publishSiteContentRequested(next))}
        />
    )
}

const FaqAuthed = () => <FaqConnected canEdit={useIsAuthenticated()} />

/** The connected FAQ page: public accordion for visitors; the signed-in
    teacher (or auth-less local dev) also gets the inline editor. */
export const FaqLanding = () =>
    isAuthConfigured() ? <FaqAuthed /> : <FaqConnected canEdit={true} />
