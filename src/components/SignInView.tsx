import { Button } from '@mui/material'
import { signIn } from '../auth/msal'

/**
 * What a signed-out visitor sees in place of a teacher page. Public pages
 * (Offerings, Contact us) never render this — they stay reachable, matching
 * REQ-006/007; the API-side gate is what actually protects the data.
 */
export const SignInView = () => (
    <section className="content-stack">
        <div className="card signin-card">
            <p className="eyebrow">Teacher portal</p>
            <h3>Sign in to continue</h3>
            <p>
                Student records, payments and the class planner are for the
                teacher only. Sign in with your Microsoft account to open them.
            </p>
            <Button variant="contained" onClick={() => void signIn()}>
                Sign in with Microsoft
            </Button>
        </div>
    </section>
)
