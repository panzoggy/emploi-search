import { useState } from 'react'
import { Mail, User, Loader2 } from 'lucide-react'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Card } from '../components/Card'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast.error('Veuillez entrer votre email')
      return
    }
    
    setLoading(true)
    try {
      await login(email.trim(), name.trim() || undefined)
      toast.success('Connexion réussie !')
      window.location.href = '/'
    } catch (error) {
      toast.error('Erreur lors de la connexion')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <svg className="mx-auto h-12 w-12 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 13.5V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5" />
            <path d="M3 10h18" />
            <path d="M15 3v6" />
            <path d="M9 3v6" />
          </svg>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">EmploiSearch</h1>
          <p className="mt-2 text-gray-500">Connectez-vous pour accéder à votre tableau de bord</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
          />
          
          <Input
            label="Nom (optionnel)"
            placeholder="Votre nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            leftIcon={<User className="h-5 w-5 text-gray-400" />}
          />
          
          <Button type="submit" className="w-full" loading={loading} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : ''}
            Se connecter
          </Button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-500">
          Aucune inscription requise. Votre email sert d'identifiant unique.
        </p>
      </Card>
    </div>
  )
}