import { useEffect, useState } from 'react'
import { Button, IconButton, TextField } from '@mui/material'
import { Link } from 'react-router-dom'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import { useIsAuthenticated } from '@azure/msal-react'
import { isAuthConfigured } from '../auth/msal'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
    fetchSiteContentRequested,
    publishSiteContentRequested,
} from '../store/store'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import type { PricingSection, SiteContent } from '../data/siteContent'
import { paths } from '../paths'
import { PageLoading } from './PageLoading'

/** Editable rows, keyed like every other list editor. */
type RateRow = { key: string; label: string; from: string }
type FactorRow = { key: string; title: string; detail: string }

let rowCounter = 0
const newRowKey = () => `price-row-${++rowCounter}`

const toRateRows = (pricing: PricingSection): RateRow[] =>
    pricing.rates.map((rate) => ({
        key: newRowKey(),
        label: rate.label,
        from: String(rate.fromPerHour),
    }))

const toFactorRows = (pricing: PricingSection): FactorRow[] =>
    pricing.factors.map((factor) => ({ key: newRowKey(), ...factor }))

/** Rows back into the publishable shape; half-filled rows are left out. */
const assemble = (
    rates: RateRow[],
    factors: FactorRow[],
    note: string
): PricingSection => ({
    rates: rates
        .map((row) => ({
            label: row.label.trim(),
            fromPerHour: Math.floor(Number(row.from)),
        }))
        .filter(
            (rate) =>
                rate.label.length > 0 &&
                Number.isFinite(rate.fromPerHour) &&
                rate.fromPerHour > 0
        ),
    factors: factors
        .map((row) => ({ title: row.title.trim(), detail: row.detail.trim() }))
        .filter((factor) => factor.title.length > 0 && factor.detail.length > 0),
    note: note.trim(),
})

type PricingViewProps = {
    content: SiteContent
    /** The signed-in teacher (or auth-less local dev) edits in place —
        the FAQ-page pattern (owner call). */
    canEdit: boolean
    publishing: boolean
    onPublish: (content: SiteContent) => void
    /** False hides the Contact-me door — all contact fields are blank
        (owner call, 2026-08-07). Defaults open for bare renders. */
    contactPublished?: boolean
}

/**
 * Transparent pricing (REQ-022): per-level from-rates, the named factors
 * that shape the exact figure, and the honest close — agreed at the free
 * assessment. Public page; the teacher edits and publishes right here.
 */
export const PricingView = ({
    content,
    canEdit,
    publishing,
    onPublish,
    contactPublished = true,
}: PricingViewProps) => {
    useDocumentMeta(
        'Pricing — AbhiTutor',
        'Clear tutoring rates: lessons generally start from £20 per session per student at GCSE, with the exact rate agreed at a free assessment.'
    )
    const { pricing } = content
    const [rates, setRates] = useState<RateRow[]>(() => toRateRows(pricing))
    const [factors, setFactors] = useState<FactorRow[]>(() =>
        toFactorRows(pricing)
    )
    const [note, setNote] = useState(pricing.note)
    const [edited, setEdited] = useState(false)
    useEffect(() => {
        if (!edited) {
            setRates(toRateRows(pricing))
            setFactors(toFactorRows(pricing))
            setNote(pricing.note)
        }
    }, [pricing, edited])

    const touch = () => setEdited(true)
    const assembled = assemble(rates, factors, note)
    // Same-shaped both sides (see AboutView): the API's key order must
    // not keep Publish lit.
    const dirty =
        JSON.stringify(assembled) !==
        JSON.stringify(
            assemble(toRateRows(pricing), toFactorRows(pricing), pricing.note)
        )
    // The chat line anchors on the cheapest published rate.
    const minRate = pricing.rates.length
        ? Math.min(...pricing.rates.map((rate) => rate.fromPerHour))
        : 0

    return (
        <section className="content-stack pricing-page">
            <div className="card">
                <div className="section-header">
                    <div>
                        <h3 className="page-heading">
                            <SellOutlinedIcon fontSize="small" />
                            Clear, simple pricing
                        </h3>
                        <p className="section-subtitle">
                            Per session, per student — and always agreed with
                            you before lessons begin.
                        </p>
                    </div>
                    {canEdit && (
                        <Button
                            variant="contained"
                            disabled={publishing || !dirty}
                            onClick={() =>
                                onPublish({ ...content, pricing: assembled })
                            }
                        >
                            {publishing ? 'Publishing…' : 'Publish pricing'}
                        </Button>
                    )}
                </div>

                {pricing.rates.length === 0 && (
                    <p className="section-subtitle">
                        {canEdit
                            ? 'No rates published yet — add them below and publish.'
                            : 'Rates are agreed individually — ask me for a quote below.'}
                    </p>
                )}
                {pricing.rates.length > 0 && (
                    <ul className="pricing-rates" aria-label="Rates by level">
                        {pricing.rates.map((rate) => (
                            <li key={rate.label}>
                                <span className="pricing-rate-label">
                                    {rate.label}
                                </span>
                                <span className="pricing-rate-price">
                                    from £{rate.fromPerHour}
                                    <small>/session · per student</small>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {pricing.factors.length > 0 && (
                    <div className="pricing-factors">
                        <h4 className="offerings-heading">
                            What shapes the exact rate
                        </h4>
                        <ul>
                            {pricing.factors.map((factor) => (
                                <li key={factor.title}>
                                    <strong>{factor.title}</strong>
                                    <p>{factor.detail}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {pricing.note && (
                    <p className="pricing-note">{pricing.note}</p>
                )}

                <div className="pricing-cta">
                    <p className="pricing-cta-line">
                        {minRate > 0
                            ? `Lessons generally start from £${minRate}/session — let's have a chat to get a clearer picture of what your child needs.`
                            : "Let's have a chat to get a clearer picture of what your child needs."}
                    </p>
                    <div className="pricing-cta-actions">
                        <Button
                            variant="contained"
                            component={Link}
                            to={paths.enquire}
                        >
                            Get your exact rate — free assessment
                        </Button>
                        {contactPublished && (
                            <Button
                                variant="outlined"
                                component={Link}
                                to={paths.contact}
                            >
                                Contact me
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {canEdit && (
                <div className="card">
                    <div className="section-header">
                        <div>
                            <h4 className="offerings-heading">
                                Edit the pricing
                            </h4>
                            <p className="section-subtitle">
                                Rates are whole pounds per session per student.
                                A row missing its level or price is left out
                                when you publish.
                            </p>
                        </div>
                        <Button
                            size="small"
                            startIcon={<AddRoundedIcon fontSize="small" />}
                            onClick={() => {
                                touch()
                                setRates((current) => [
                                    ...current,
                                    { key: newRowKey(), label: '', from: '' },
                                ])
                            }}
                        >
                            Add rate
                        </Button>
                    </div>
                    <div className="sortable-rows">
                        {rates.map((row) => (
                            <div
                                key={row.key}
                                className="site-editor-point-row pricing-rate-row"
                            >
                                <TextField
                                    label="Level"
                                    size="small"
                                    value={row.label}
                                    onChange={(event) => {
                                        touch()
                                        setRates((current) =>
                                            current.map((item) =>
                                                item.key === row.key
                                                    ? {
                                                          ...item,
                                                          label: event.target
                                                              .value,
                                                      }
                                                    : item
                                            )
                                        )
                                    }}
                                    helperText="e.g. GCSE, A-level, KS3"
                                />
                                <TextField
                                    label="From £/session"
                                    size="small"
                                    type="number"
                                    slotProps={{
                                        htmlInput: { min: 1, max: 999 },
                                    }}
                                    value={row.from}
                                    onChange={(event) => {
                                        touch()
                                        setRates((current) =>
                                            current.map((item) =>
                                                item.key === row.key
                                                    ? {
                                                          ...item,
                                                          from: event.target
                                                              .value,
                                                      }
                                                    : item
                                            )
                                        )
                                    }}
                                />
                                <IconButton
                                    size="small"
                                    aria-label={`Remove ${row.label || 'new rate'}`}
                                    onClick={() => {
                                        touch()
                                        setRates((current) =>
                                            current.filter(
                                                (item) =>
                                                    item.key !== row.key
                                            )
                                        )
                                    }}
                                >
                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                            </div>
                        ))}
                    </div>

                    <div className="section-header pricing-factors-header">
                        <h4 className="offerings-heading">
                            Factors shown under the rates
                        </h4>
                        <Button
                            size="small"
                            startIcon={<AddRoundedIcon fontSize="small" />}
                            onClick={() => {
                                touch()
                                setFactors((current) => [
                                    ...current,
                                    {
                                        key: newRowKey(),
                                        title: '',
                                        detail: '',
                                    },
                                ])
                            }}
                        >
                            Add factor
                        </Button>
                    </div>
                    <div className="sortable-rows">
                        {factors.map((row) => (
                            <div
                                key={row.key}
                                className="site-editor-point-row"
                            >
                                <TextField
                                    label="Factor"
                                    size="small"
                                    value={row.title}
                                    onChange={(event) => {
                                        touch()
                                        setFactors((current) =>
                                            current.map((item) =>
                                                item.key === row.key
                                                    ? {
                                                          ...item,
                                                          title: event.target
                                                              .value,
                                                      }
                                                    : item
                                            )
                                        )
                                    }}
                                />
                                <TextField
                                    label="Detail"
                                    size="small"
                                    multiline
                                    value={row.detail}
                                    onChange={(event) => {
                                        touch()
                                        setFactors((current) =>
                                            current.map((item) =>
                                                item.key === row.key
                                                    ? {
                                                          ...item,
                                                          detail: event.target
                                                              .value,
                                                      }
                                                    : item
                                            )
                                        )
                                    }}
                                />
                                <IconButton
                                    size="small"
                                    aria-label={`Remove ${row.title || 'new factor'}`}
                                    onClick={() => {
                                        touch()
                                        setFactors((current) =>
                                            current.filter(
                                                (item) =>
                                                    item.key !== row.key
                                            )
                                        )
                                    }}
                                >
                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                            </div>
                        ))}
                    </div>

                    <TextField
                        label="Closing note"
                        size="small"
                        multiline
                        fullWidth
                        value={note}
                        onChange={(event) => {
                            touch()
                            setNote(event.target.value)
                        }}
                        helperText="e.g. “Your exact rate is agreed at the free assessment — no obligation, no surprises.”"
                    />
                </div>
            )}
        </section>
    )
}

const PricingConnected = ({ canEdit }: { canEdit: boolean }) => {
    const dispatch = useAppDispatch()
    const content = useAppSelector((state) => state.students.siteContent)
    const publishing = useAppSelector(
        (state) => state.students.publishingSiteContent
    )
    const loaded = useAppSelector(
        (state) => state.students.siteContentLoaded
    )
    // The Sidebar fetches the published contact app-wide; this only reads.
    const contact = useAppSelector((state) => state.students.contact)
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
        <PricingView
            content={content}
            canEdit={canEdit}
            publishing={publishing}
            contactPublished={Boolean(contact.email || contact.phone)}
            onPublish={(next) => dispatch(publishSiteContentRequested(next))}
        />
    )
}

const PricingAuthed = () => <PricingConnected canEdit={useIsAuthenticated()} />

/** The connected pricing page: public for visitors; the signed-in teacher
    (or auth-less local dev) edits in place. */
export const PricingLanding = () =>
    isAuthConfigured() ? (
        <PricingAuthed />
    ) : (
        <PricingConnected canEdit={true} />
    )
