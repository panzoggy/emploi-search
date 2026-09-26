import { useEffect, useState, type FormEvent } from 'react'
import { apiErrorMessage } from '../shared/api/client'
import { authApi } from './auth-api'
import { useAuth } from './AuthProvider'

export type AuthMode = 'login' | 'register'

export function useAuthForm() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [fields, setFields] = useState({ username: '', password: '', signupCode: '' })
  const codeRequired = useSignupCodeRequired()
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const set = (key: keyof typeof fields) => (value: string) => setFields(f => ({ ...f, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      const { signupCode, ...credentials } = fields
      await (mode === 'login' ? login(credentials) : register({ ...credentials, signupCode: signupCode || undefined }))
    } catch (err) {
      setError(apiErrorMessage(err, 'Connexion impossible'))
      setSending(false)
    }
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setError(null)
  }

  return { mode, switchMode, fields, set, codeRequired, error, sending, submit }
}

// L'hébergeur peut exiger un code pour créer un compte (instance ouverte sur Internet)
function useSignupCodeRequired(): boolean {
  const [required, setRequired] = useState(false)
  useEffect(() => {
    authApi.config().then(
      c => setRequired(c.signupCodeRequired),
      () => undefined,
    )
  }, [])
  return required
}
