import type { ApproachPoint } from '../data/siteContent'

type OfferingsViewProps = {
    intro: string
    subjects: string[]
    approach: ApproachPoint[]
}

/** Public page: what is taught, and how. Shows no student data. */
export const OfferingsView = ({
    intro,
    subjects,
    approach,
}: OfferingsViewProps) => (
    <section className="content-stack">
        <div className="card">
            <div className="section-header">
                <div>
                    <h3>Offerings</h3>
                    <p className="section-subtitle">{intro}</p>
                </div>
            </div>

            <h4 className="offerings-heading">Subjects taught</h4>
            {subjects.length > 0 ? (
                <ul className="offerings-subjects">
                    {subjects.map((subject) => (
                        <li key={subject} className="offerings-subject">
                            {subject}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="section-subtitle">
                    Subject list coming soon — please get in touch.
                </p>
            )}
        </div>

        <div className="card">
            <h4 className="offerings-heading">How we work</h4>
            <ul className="offerings-approach">
                {approach.map((point) => (
                    <li key={point.title} className="offerings-point">
                        <h5 className="offerings-point-title">{point.title}</h5>
                        <p className="offerings-point-detail">{point.detail}</p>
                    </li>
                ))}
            </ul>
        </div>
    </section>
)
