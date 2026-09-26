import type { ReactNode } from 'react'
import { Button } from '../shared/ui/Button'
import { Segmented } from '../shared/ui/Segmented'
import { TextField } from '../shared/ui/TextField'
import { useAuthForm, type AuthMode } from './useAuthForm'

const MODES: { value: AuthMode; label: string }[] = [
  { value: 'login', label: 'Connexion' },
  { value: 'register', label: 'Créer un compte' },
]

export function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_480px]">
      <section className="flex flex-col justify-between border-b border-rule p-6 lg:border-b-0 lg:border-r lg:p-10">
        <p className="flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.14em]">
          <span className="h-3 w-3 bg-accent" aria-hidden /> Emploi
        </p>
        <div className="mt-16 lg:mt-0">
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-title sm:text-6xl">
            Les offres d'emploi, triées pour toi.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-fg-2">
            HelloWork, Indeed et LinkedIn réunis, classés selon ton profil. Une offre vue ne revient jamais, sauf si tu
            la gardes.
          </p>
        </div>
        <p className="label mt-16 lg:mt-0">HelloWork · Indeed · LinkedIn</p>
      </section>
      <section className="flex items-center p-6 lg:p-10">
        <AuthForm />
      </section>
    </div>
  )
}

function AuthForm() {
  const { mode, switchMode, fields, set, codeRequired, error, sending, submit } = useAuthForm()
  const registering = mode === 'register'
  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-5" noValidate>
      <Segmented label="Mode" value={mode} options={MODES} onChange={switchMode} />
      <CredentialFields registering={registering} fields={fields} set={set} />
      {registering && codeRequired && (
        <Field label="Code d'inscription" hint="Donné par la personne qui héberge l'application">
          <TextField value={fields.signupCode} onChange={e => set('signupCode')(e.target.value)} />
        </Field>
      )}
      {error && (
        <p role="alert" className="border-l-2 border-danger pl-3 text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" className="w-full" loading={sending}>
        {registering ? 'Créer mon compte' : 'Se connecter'}
      </Button>
    </form>
  )
}

const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <label className="block space-y-2">
    <span className="label">{label}</span>
    {children}
    {hint && <span className="block text-xs text-fg-3">{hint}</span>}
  </label>
)

type Form = ReturnType<typeof useAuthForm>

function CredentialFields({ registering, fields, set }: { registering: boolean } & Pick<Form, 'fields' | 'set'>) {
  return (
    <>
      <Field label="Identifiant" hint={registering ? '3 à 32 caractères : lettres, chiffres, point, tiret' : undefined}>
        <TextField
          autoComplete="username"
          autoCapitalize="none"
          value={fields.username}
          onChange={e => set('username')(e.target.value)}
        />
      </Field>
      <Field label="Mot de passe" hint={registering ? '8 caractères minimum' : undefined}>
        <TextField
          type="password"
          autoComplete={registering ? 'new-password' : 'current-password'}
          value={fields.password}
          onChange={e => set('password')(e.target.value)}
        />
      </Field>
    </>
  )
}
