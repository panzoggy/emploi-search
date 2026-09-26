import axios from 'axios'

export const api = axios.create({ baseURL: '/api', timeout: 30_000, withCredentials: true })

// Session expirée pendant l'utilisation : on prévient l'application, qui ramène à l'écran de connexion
export const SESSION_EXPIRED_EVENT = 'emploi:session-expirée'

api.interceptors.response.use(
  response => response,
  (error: unknown) => {
    const onAuthRoute = axios.isAxiosError(error) && error.config?.url?.startsWith('/auth/')
    if (axios.isAxiosError(error) && error.response?.status === 401 && !onAuthRoute) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)

// Message lisible pour l'utilisateur, quelle que soit la forme de l'erreur
export function apiErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data
    if (data && typeof data === 'object' && 'details' in data && Array.isArray(data.details) && data.details.length) {
      return String(data.details[0]).replace(/^[\w.]+ : /, '')
    }
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') return data.error
    if (!error.response) return 'Serveur injoignable'
  }
  return fallback
}
