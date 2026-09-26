// Interface publique du domaine authentification
export { authRouter } from './auth.routes.js'
export { requireAuth } from './require-auth.js'
export { purgeExpiredSessions } from './sessions.js'
