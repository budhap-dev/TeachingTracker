/**
 * Aggregate teaching outcomes for the public outcomes strip (REQ-020).
 * Whole-app tallies computed by the API from live data — never a name or
 * anything traceable to a student.
 */
export interface Outcomes {
    /** Students ever taught — the active roster plus alumni. */
    studentsTaught: number
    /** Classes actually held; a group class counts once (REQ-011). */
    sessionsDelivered: number
    /** Teaching time behind those classes, in whole hours. */
    hoursDelivered: number
    /** Distinct subjects across every student taught. */
    subjectsCount: number
    /** Mean star rating (1–5, one decimal) across approved reviews — the
        only public ones (REQ-027); 0 when there are none yet. */
    averageRating: number
    /** How many approved reviews back that rating. */
    reviewCount: number
}
