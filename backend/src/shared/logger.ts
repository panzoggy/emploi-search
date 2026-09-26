import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Un cookie de session dans un fichier de logs suffirait à usurper le compte
  redact: {
    paths: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]', 'req.body.password'],
    censor: '[masqué]',
  },
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty', options: { colorize: true } },
})

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
