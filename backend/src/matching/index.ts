// Interface publique du domaine matching
export { embedOffers, rescoreOffers, scheduleRescore } from './matching.service.js'
export { warmUpEmbeddings } from './embeddings.js'
export type { MatchReason, Verdict } from './scoring.js'
