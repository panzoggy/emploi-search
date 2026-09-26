import { api } from '../shared/api/client'

export interface Credentials {
  username: string
  password: string
  signupCode?: string
}

export const authApi = {
  me: async (): Promise<string> => (await api.get<{ username: string }>('/auth/me')).data.username,
  config: async (): Promise<{ signupCodeRequired: boolean }> =>
    (await api.get<{ signupCodeRequired: boolean }>('/auth/config')).data,
  login: async (c: Credentials): Promise<string> =>
    (await api.post<{ username: string }>('/auth/login', c)).data.username,
  register: async (c: Credentials): Promise<string> =>
    (await api.post<{ username: string }>('/auth/register', c)).data.username,
  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },
}
