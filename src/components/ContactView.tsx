import { toTelHref, toWhatsAppHref } from '../data/siteContent'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

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
                    <h3 className="page-heading">
                        <MailOutlineRoundedIcon fontSize="small" />
                        Contact us
                    </h3>
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
                    <span className="contact-value contact-phone">
                        <span className="contact-number">{phone}</span>
                        <a
                            className="contact-icon"
                            href={toTelHref(phone)}
                            aria-label={`Call ${phone}`}
                        >
                            <PhoneRoundedIcon fontSize="small" />
                        </a>
                        <a
                            className="contact-icon whatsapp"
                            href={toWhatsAppHref(phone)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`WhatsApp ${phone}`}
                        >
                            <WhatsAppIcon fontSize="small" />
                        </a>
                    </span>
                </li>
            </ul>

            <p className="contact-note">
                We usually reply within a day. Lessons run in person or online.
            </p>
        </div>
    </section>
)
