import { Button } from '@mui/material'
import { Link } from 'react-router-dom'
import { signIn } from '../auth/msal'
import { paths } from '../paths'

/**
 * What a signed-out visitor sees in place of a teacher page — the public
 * landing (REQ-003). It leads with the visitor actions; teacher sign-in is
 * a quiet afterline, not the headline. Public pages (Offerings, Contact us)
 * never render this — they stay reachable, matching REQ-006/007; the
 * API-side gate is what actually protects the data.
 */
export const SignInView = () => (
    <section className="content-stack">
        <div className="card signin-card">
            <p className="eyebrow">Springboard Tutoring</p>
            <h3>Welcome to Springboard</h3>
            <p>
                Personal tutoring, one to one or in small groups. Explore the
                subjects and how lessons run, or get in touch to arrange a
                first session.
            </p>
            <div className="signin-visitor-actions">
                <Button
                    variant="contained"
                    component={Link}
                    to={paths.offerings}
                >
                    What we offer
                </Button>
                <Button variant="outlined" component={Link} to={paths.contact}>
                    Get in touch
                </Button>
            </div>
            <p className="signin-teacher-line">
                Are you the teacher?{' '}
                <Button
                    size="small"
                    variant="text"
                    onClick={() => void signIn()}
                >
                    Sign in with Microsoft
                </Button>
            </p>
        </div>
    </section>
)
