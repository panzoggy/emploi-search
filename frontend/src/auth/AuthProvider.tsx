import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SESSION_EXPIRED_EVENT } from '../shared/api/client'
import { authApi, type Credentials } from './auth-api'

type AuthState = { status: 'loading' } | { status: 'anonymous' } | { status: 'signed-in'; username: string }

interface Auth {
  state: AuthState
  login: (c: Credentials) => Promise<void>
  register: (c: Credentials) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const signedIn = (username: string) => setState({ status: 'signed-in', username })

  useEffect(() => {
    authApi.me().then(signedIn, () => setState({ status: 'anonymous' }))
    const expire = () => setState({ status: 'anonymous' })
    window.addEventListener(SESSION_EXPIRED_EVENT, expire)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire)
  }, [])

  const login = useCallback(async (c: Credentials) => signedIn(await authApi.login(c)), [])
  const register = useCallback(async (c: Credentials) => signedIn(await authApi.register(c)), [])
  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined) // la session est oubliée côté navigateur dans tous les cas
    setState({ status: 'anonymous' })
  }, [])

  const value = useMemo(() => ({ state, login, register, logout }), [state, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): Auth {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé sous AuthProvider')
  return context
}
