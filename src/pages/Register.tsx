import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: string[] = []
    if (!email) errs.push('Email is required.')
    if (!password) errs.push('Password is required.')
    if (password.length < 8) errs.push('Password must be at least 8 characters.')
    if (password !== confirm) errs.push('Passwords do not match.')
    if (errs.length) { setError(errs.join(' ')); return }

    setLoading(true)
    const { error } = await signUp(email, password)
    setLoading(false)
    if (error) setError(error)
    else navigate('/')
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-center mb-1">Create account</h1>
        <p className="text-neutral-500 text-center mb-6 text-sm">Join Commerce in seconds</p>
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" autoComplete="new-password" />
            <p className="text-xs text-neutral-400 mt-1">Minimum 8 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" autoComplete="new-password" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-neutral-500">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
