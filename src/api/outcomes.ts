import type { Outcomes } from '../data/outcomes'
import { apiRequest } from './client'

/** GET /outcomes — public: the outcomes strip's live tallies (REQ-020). */
export const fetchOutcomes = (): Promise<Outcomes> =>
    apiRequest<Outcomes>('/outcomes')
