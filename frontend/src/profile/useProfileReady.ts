import { useEffect, useState } from 'react'
import { profileApi } from './profile-api'

// Le flux a besoin de savoir si un profil minimal existe, pour guider l'utilisateur
export function useProfileReady(): boolean | null {
  const [ready, setReady] = useState<boolean | null>(null)
  useEffect(() => {
    profileApi.get().then(
      p => setReady(p.targetTitles.length > 0),
      () => setReady(true), // en cas d'erreur on n'affiche pas l'invitation à tort
    )
  }, [])
  return ready
}
