import axios from 'axios'

export const httpClient = axios.create({
  timeout: 20_000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.6',
  },
})

export const isBlockedStatus = (error: unknown): boolean =>
  axios.isAxiosError(error) && [403, 429, 999].includes(error.response?.status ?? 0)

export const politeDelay = (min = 600, max = 1500): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)))
