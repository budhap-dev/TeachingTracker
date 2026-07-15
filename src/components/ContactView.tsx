import { toTelHref } from '../data/siteContent'

type ContactViewProps = {
    email: string
    phone: string
}

/** Public page: how to get in touch. Shows no student data. */
export const ContactView = ({ email, phone }: ContactViewProps) => (
    <section className="content-stack">
        <div className="card">
            <div className="section-header">
                <div>
                    <h3>Contact us</h3>
                    <p className="section-subtitle">
                        Questions about tutoring, availability, or a particular
                        subject? Get in touch and we&apos;ll come back to you.
                    </p>
                </div>
            </div>

            <ul className="contact-list">
                <li className="contact-item">
                    <span className="contact-label">Email</span>
                    <a className="contact-value" href={`mailto:${email}`}>
                        {email}
                    </a>
                </li>
                <li className="contact-item">
                    <span className="contact-label">Phone</span>
                    <a className="contact-value" href={toTelHref(phone)}>
                        {phone}
                    </a>
                </li>
            </ul>

            <p className="contact-note">
                We usually reply within a day. Lessons run in person or online.
            </p>
        </div>
    </section>
)
