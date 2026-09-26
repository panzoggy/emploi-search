import { useState, type Dispatch, type SetStateAction } from 'react'
import toast from 'react-hot-toast'
import { apiErrorMessage } from '../shared/api/client'
import { profileApi } from './profile-api'
import type { CvSuggestions, Profile } from './types'

export function useCv(setProfile: Dispatch<SetStateAction<Profile | null>>) {
  const [suggestions, setSuggestions] = useState<CvSuggestions | null>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const result = await profileApi.uploadCv(file)
      setProfile(result.profile)
      setSuggestions(result.suggestions)
    } catch (err) {
      toast.error(apiErrorMessage(err, "Le CV n'a pas pu être lu"))
    } finally {
      setUploading(false)
    }
  }

  const remove = async () => {
    try {
      await profileApi.removeCv()
      setProfile(p =>
        p ? { ...p, hasCv: false, hasCvFile: false, cvFileName: null, cvUpdatedAt: null, cvText: null } : p,
      )
      setSuggestions(null)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Impossible de retirer le CV'))
    }
  }

  return { suggestions, uploading, upload, remove }
}
