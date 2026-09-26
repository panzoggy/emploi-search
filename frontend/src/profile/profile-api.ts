import { api } from '../shared/api/client'
import type { CvSuggestions, Profile, ProfilePreferences } from './types'

export const profileApi = {
  get: async (): Promise<Profile> => (await api.get<Profile>('/profile')).data,
  save: async (prefs: ProfilePreferences): Promise<Profile> => (await api.put<Profile>('/profile', prefs)).data,
  uploadCv: async (file: File): Promise<{ profile: Profile; suggestions: CvSuggestions }> => {
    const form = new FormData()
    form.append('cv', file)
    return (await api.post<{ profile: Profile; suggestions: CvSuggestions }>('/profile/cv', form, { timeout: 60_000 }))
      .data
  },
  removeCv: async (): Promise<void> => {
    await api.delete('/profile/cv')
  },
}
