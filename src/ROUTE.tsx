import { Navigate, Route, Routes } from 'react-router-dom'
import { paths } from './paths'
import { RequireTeacher } from './components/RequireTeacher'
import { PrivacyView } from './components/PrivacyView'
import { FaqLanding } from './components/FaqView'
import { PricingLanding } from './components/PricingView'
import { AboutLanding } from './components/AboutView'
import { ScrollToTop } from './components/ScrollToTop'
import { CountPageVisit } from './components/CountPageVisit'
import type { PageKey } from './api/pageVisits'
import { DashboardRoute } from './routes/dashboard'
import { StudentsRoute, StudentDetailRoute } from './routes/students'
import { AlumniRoute } from './routes/alumni'
import { StudySnapshotRoute } from './routes/studySnapshot'
import { PaymentTrackerRoute } from './routes/paymentTracker'
import { ClassNotesRoute, SchedulingRoute } from './routes/scheduling'
import { OfferingsRoute } from './routes/offerings'
import { SiteEditorRoute } from './routes/siteEditor'
import { ContactRoute } from './routes/contact'
import { ReviewsRoute } from './routes/reviews'
import { ReviewModerationRoute } from './routes/reviewModeration'
import { EnquireRoute } from './routes/enquire'
import { LeadsRoute } from './routes/leads'
import { VisitsRoute } from './routes/visits'

/**
 * The router, and only the router (REQ-047). Every page's connected component
 * lives beside it in `routes/`, one file per feature area — this file is the
 * map, not the territory.
 */

/**
 * A public page, counted (REQ-058). The counter renders nothing; it sits
 * beside the page so the router shows at a glance which pages are counted and
 * which — every teacher screen — are not.
 */
const counted = (page: PageKey, element: JSX.Element) => (
    <>
        <CountPageVisit page={page} />
        {element}
    </>
)
/** Teacher-only route element: gated by sign-in when auth is configured. */
const teacher = (page: JSX.Element) => <RequireTeacher>{page}</RequireTeacher>

export const AppRoutes = () => (
    <>
        <ScrollToTop />
        <Routes>
            <Route
                path={paths.dashboard}
                element={teacher(<DashboardRoute />)}
            />
            <Route path={paths.students} element={teacher(<StudentsRoute />)} />
            <Route
                path="/students/:studentId"
                element={teacher(<StudentDetailRoute />)}
            />
            <Route
                path="/students/:studentId/diary"
                element={teacher(<StudentDetailRoute tab="diary" />)}
            />
            <Route
                path={paths.studySnapshot}
                element={teacher(<StudySnapshotRoute />)}
            />
            <Route path={paths.alumni} element={teacher(<AlumniRoute />)} />
            <Route
                path={paths.payments}
                element={teacher(<PaymentTrackerRoute />)}
            />
            <Route
                path={paths.scheduling}
                element={teacher(<SchedulingRoute />)}
            />
            {/* The planner's notes, read date-wise (REQ-052) — same data,
                no new API surface. */}
            <Route
                path={paths.classNotes}
                element={teacher(<ClassNotesRoute />)}
            />
            {/* Public by requirement (REQ-006/007): reachable signed out. */}
            <Route
                path={paths.offerings}
                element={counted('offerings', <OfferingsRoute />)}
            />
            <Route
                path={paths.enquire}
                element={counted('enquire', <EnquireRoute />)}
            />
            <Route path={paths.leads} element={teacher(<LeadsRoute />)} />
            <Route
                path={paths.siteEditor}
                element={teacher(<SiteEditorRoute />)}
            />
            <Route
                path={paths.contact}
                element={counted('contact', <ContactRoute />)}
            />
            {/* Public by requirement (REQ-031): the privacy notice must be
                readable by families who never sign in. */}
            <Route
                path={paths.privacy}
                element={counted('privacy', <PrivacyView />)}
            />
            {/* Public reviews (REQ-027); moderation is teacher-only. */}
            <Route
                path={paths.reviews}
                element={counted('reviews', <ReviewsRoute />)}
            />
            {/* The FAQ on its own page (REQ-025, owner call 2026-08-04);
                the signed-in teacher edits it right there. */}
            <Route
                path={paths.faq}
                element={counted('faq', <FaqLanding />)}
            />
            {/* Transparent pricing (REQ-022) — public, edited in place. */}
            <Route
                path={paths.pricing}
                element={counted('pricing', <PricingLanding />)}
            />
            {/* About the teacher (REQ-037) — public, edited in place. */}
            <Route
                path={paths.about}
                element={counted('about', <AboutLanding />)}
            />
            <Route
                path={paths.reviewsModeration}
                element={teacher(<ReviewModerationRoute />)}
            />
            {/* How the public site is doing (REQ-058) — teacher-only. */}
            <Route path={paths.visits} element={teacher(<VisitsRoute />)} />
            <Route
                path="*"
                element={<Navigate to={paths.dashboard} replace />}
            />
        </Routes>
    </>
)
