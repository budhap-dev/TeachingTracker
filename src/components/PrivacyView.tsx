import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { paths } from '../paths'

/**
 * The public privacy policy (REQ-031). Bundled, not teacher-editable: legal
 * text changes deliberately, via review — and every claim here must stay
 * true of the build (see docs/STORIES.md REQ-031/034). Plain English on
 * purpose: it is addressed to parents, including the parents of the children
 * whose details the teacher records.
 */

/** One row of the what-we-collect table. */
type InventoryRow = {
    data: string
    source: string
    why: string
    basis: string
}

const inventory: InventoryRow[] = [
    {
        data: "Student details — name, date of birth, school, year, subjects, progress and lesson notes, parent's name and phone number, home address",
        source: 'Given to the teacher by you, the parent, when tutoring is arranged',
        why: 'To plan, deliver and record your child’s tutoring',
        basis: 'Contract — delivering the tutoring you asked for',
    },
    {
        data: 'Enquiries — your name, email and/or phone, your child’s year, subjects and your goal',
        source: 'The Enquire form on this site',
        why: 'To reply to you about tutoring',
        basis: 'Legitimate interest — answering your enquiry',
    },
    {
        data: 'Reviews — your name, role, rating and words',
        source: 'The Reviews form on this site',
        why: 'To show genuine feedback, once approved',
        basis: 'Consent — you submit it for publication',
    },
    {
        data: 'Payment records — amounts recorded against each student’s month',
        source: 'Recorded by the teacher',
        why: 'To track what has been paid for lessons taught',
        basis: 'Contract, and keeping proper business records',
    },
]

export const PrivacyView = () => {
    useDocumentMeta(
        'Privacy policy — Springboard Tutoring',
        'What Springboard Tutoring collects, why, how long it is kept, and your rights — including how to ask for your family’s details to be corrected or deleted.'
    )

    return (
        <section className="content-stack privacy-page">
            <div className="card">
                <h3 className="page-heading">
                    <PrivacyTipOutlinedIcon fontSize="small" />
                    Privacy policy
                </h3>
                <p className="section-subtitle">
                    How Springboard Tutoring handles your family&apos;s
                    details. Short version: we collect only what tutoring
                    needs, we never sell or share it for marketing, and you
                    can ask for it — or ask for it to be gone — at any time.
                </p>
                <p className="privacy-updated">Last updated: 31 July 2026</p>
            </div>

            <div className="card">
                <h4 className="offerings-heading">Who we are</h4>
                <p>
                    Springboard Tutoring is a small, single-tutor teaching
                    practice, and the tutor is the data controller for
                    everything described here. For anything in this policy —
                    questions, requests, corrections — use the details on the{' '}
                    <a href={paths.contact}>Contact page</a>.
                </p>
            </div>

            <div className="card">
                <h4 className="offerings-heading">
                    What we collect, and why
                </h4>
                <div className="privacy-table-scroll">
                    <table className="privacy-table">
                        <thead>
                            <tr>
                                <th>What</th>
                                <th>Where it comes from</th>
                                <th>Why we have it</th>
                                <th>Lawful basis</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((row) => (
                                <tr key={row.data}>
                                    <td>{row.data}</td>
                                    <td>{row.source}</td>
                                    <td>{row.why}</td>
                                    <td>{row.basis}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p>
                    That is the whole list. There is no advertising profile,
                    no analytics tracking, and nothing is ever sold or shared
                    for marketing.
                </p>
            </div>

            <div className="card">
                <h4 className="offerings-heading">
                    Children&apos;s information
                </h4>
                <p>
                    Most of what we hold is about children — that is what
                    tutoring records are. It is always given to us by a
                    parent or guardian; this site never collects anything
                    from a child directly, and there are no accounts, forms
                    or messages aimed at children. Please keep health or
                    special-educational-needs details out of the online
                    forms — anything sensitive that genuinely helps the
                    tutoring is better discussed directly.
                </p>
            </div>

            <div className="card">
                <h4 className="offerings-heading">How long we keep it</h4>
                <ul className="privacy-list">
                    <li>
                        <strong>Enquiries</strong> — twelve months, or six
                        months once tutoring starts and the details have moved
                        into the student record. Deleted sooner on request.
                    </li>
                    <li>
                        <strong>Student records</strong> — while tutoring
                        continues, then two years, so a returning student
                        picks up where they left off. After that they are
                        deleted.
                    </li>
                    <li>
                        <strong>Payment records</strong> — up to six years,
                        because UK tax rules require business records to be
                        kept.
                    </li>
                    <li>
                        <strong>Reviews</strong> — while published; removed
                        on request at any time. Reviews we do not publish are
                        deleted.
                    </li>
                </ul>
                <p>
                    We check these dates and clear out what is past them every
                    three months. One honest detail: we keep a monthly private
                    copy of our records in case something breaks, so a deleted
                    record can linger in those copies for up to a year before
                    they are rotated out.
                </p>
            </div>

            <div className="card">
                <h4 className="offerings-heading">
                    Where it lives, and who processes it
                </h4>
                <p>
                    Everything is stored on Microsoft Azure in the{' '}
                    <strong>UK South</strong> region, encrypted at rest and
                    served over HTTPS. The teacher&apos;s area of this site
                    sits behind Microsoft Entra sign-in, and the tutor is the
                    only person with access. Microsoft processes this data as
                    our hosting provider under Microsoft&apos;s standard data
                    protection terms. No other company receives it — there
                    are no analytics, advertising or email-marketing
                    providers.
                </p>
            </div>

            <div className="card">
                <h4 className="offerings-heading">Cookies</h4>
                <p>
                    This site sets no advertising or analytics cookies, so
                    there is no cookie banner to click. The only browser
                    storage used is what Microsoft&apos;s sign-in needs when
                    the <em>teacher</em> logs in — strictly necessary, and
                    never used to track visitors. If that ever changes, we
                    will ask for consent first.
                </p>
            </div>

            <div className="card">
                <h4 className="offerings-heading">Your rights</h4>
                <p>
                    You can ask us at any time to <strong>see</strong> what we
                    hold about you or your child, to <strong>correct</strong>{' '}
                    it, to <strong>delete</strong> it, to{' '}
                    <strong>receive a copy</strong> to take elsewhere, or to{' '}
                    <strong>object</strong> to how it is used. Ask via the{' '}
                    <a href={paths.contact}>Contact page</a> and we will
                    respond within a month. Deleting a student&apos;s record
                    removes their lessons and their payment history with it.
                </p>
                <p>
                    If you are unhappy with how a request is handled, you can
                    complain to the UK Information Commissioner&apos;s Office
                    at{' '}
                    <a
                        href="https://ico.org.uk"
                        target="_blank"
                        rel="noreferrer"
                    >
                        ico.org.uk
                    </a>
                    .
                </p>
            </div>
        </section>
    )
}
