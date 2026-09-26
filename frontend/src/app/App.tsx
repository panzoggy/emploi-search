import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, LoginPage, useAuth } from '../auth'
import { FeedPage, resetOfferCache } from '../offers'
import { ProfilePage } from '../profile'
import { SearchActivityProvider, SearchesPage } from '../searches'
import { TopBar } from './TopBar'

export function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

function Gate() {
  const { state } = useAuth()
  const username = state.status === 'signed-in' ? state.username : null
  useEffect(resetOfferCache, [username])
  if (state.status === 'loading') return null
  if (state.status === 'anonymous') return <LoginPage />
  // Clé = utilisateur : changer de compte repart d'un état propre
  return <SignedInApp key={state.username} />
}

function SignedInApp() {
  return (
    <SearchActivityProvider>
      <TopBar />
      <main>
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/recherches" element={<SearchesPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </SearchActivityProvider>
  )
}
