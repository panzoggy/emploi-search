import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { apiErrorMessage } from '../shared/api/client'
import { profileApi } from './profile-api'
import { useCv } from './useCv'
import { toPreferences, type Profile, type ProfilePreferences } from './types'

export type UpdatePreference = <K extends keyof ProfilePreferences>(key: K, value: ProfilePreferences[K]) => void

// Profil enregistré + brouillon en cours d'édition ; "dirty" tant qu'ils diffèrent
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [draft, setDraft] = useState<ProfilePreferences | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cv = useCv(setProfile)

  const adopt = useCallback((loaded: Profile) => {
    setProfile(loaded)
    setDraft(toPreferences(loaded))
  }, [])

  useEffect(() => {
    profileApi.get().then(adopt, err => setError(apiErrorMessage(err, 'Impossible de charger le profil')))
  }, [adopt])

  const dirty = useMemo(
    () => Boolean(profile && draft && JSON.stringify(toPreferences(profile)) !== JSON.stringify(draft)),
    [profile, draft],
  )
  const update: UpdatePreference = useCallback((key, value) => {
    setDraft(current => (current ? { ...current, [key]: value } : current))
  }, [])

  const { saving, save } = useSaveProfile(draft, adopt)

  return { profile, draft, dirty, saving, error, update, save, cv }
}

function useSaveProfile(draft: ProfilePreferences | null, adopt: (profile: Profile) => void) {
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (!draft) return
    setSaving(true)
    try {
      adopt(await profileApi.save(draft))
      toast.success('Profil enregistré. Les scores sont recalculés.')
    } catch (err) {
      toast.error(apiErrorMessage(err, "Le profil n'a pas été enregistré"))
    } finally {
      setSaving(false)
    }
  }
  return { saving, save }
}
