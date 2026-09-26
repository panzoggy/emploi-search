import 'dotenv/config'
import { createApp } from './app.js'
import { prisma } from './shared/db.js'
import { errorMessage, logger } from './shared/logger.js'
import { recoverInterruptedSearches } from './collection/search-runner.js'
import { warmUpEmbeddings } from './matching/index.js'
import { purgeExpiredSessions } from './auth/index.js'
import { sealLegacyCvs } from './profile/index.js'
import { assertDataKey } from './shared/sealed-data.js'

// Sans clé de chiffrement, on refuse de démarrer plutôt que de stocker des CV en clair
assertDataKey()

const PORT = Number(process.env.PORT) || 4000
const DAY_MS = 86_400_000

const purgeSessions = () =>
  purgeExpiredSessions()
    .then(count => count > 0 && logger.info(`${count} sessions expirées supprimées`))
    .catch(err => logger.warn(`Purge des sessions impossible : ${errorMessage(err)}`))

const server = createApp().listen(PORT, '0.0.0.0', () => {
  logger.info(`API prête sur http://0.0.0.0:${PORT}`)
  warmUpEmbeddings()
  void purgeSessions()
  sealLegacyCvs()
    .then(count => count > 0 && logger.info(`${count} CV chiffrés`))
    .catch(err => logger.error(`Chiffrement des anciens CV impossible : ${errorMessage(err)}`))
  setInterval(() => void purgeSessions(), DAY_MS).unref()
  recoverInterruptedSearches().catch(err => logger.error(`Reprise des recherches impossible : ${errorMessage(err)}`))
})

const shutdown = () => {
  server.close(() => void prisma.$disconnect().finally(() => process.exit(0)))
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
