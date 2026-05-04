import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Send, Eye, EyeOff, Shield } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, verifyMfa } = useAuthStore()

  const [step, setStep] = useState<'login' | 'mfa'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaToken, setMfaToken] = useState('')
  const [mfaMethod, setMfaMethod] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(username, password)
      if (result.requiresMfa) {
        setMfaToken(result.mfaToken ?? '')
        setMfaMethod(result.mfaMethod ?? '')
        setStep('mfa')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyMfa(mfaToken, mfaCode)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Invalid MFA code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30">
            <Send className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">KKTC SMS</h1>
          <p className="text-gray-400 mt-1">High Performance Messaging Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          {step === 'login' ? (
            <form onSubmit={handleLogin}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Sign in</h2>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input" placeholder="Enter your username" autoFocus required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input pr-10" placeholder="Enter your password" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <a href="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700">Forgot password?</a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleMfa}>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-brand-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {mfaMethod === 'GoogleAuth' ? 'Enter the code from your Authenticator app' :
                   mfaMethod === 'Sms' ? 'Enter the code sent to your phone' :
                   'Enter the code sent to your email'}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
              )}

              <div className="space-y-4">
                <input
                  type="text" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)}
                  className="input text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000" maxLength={6} autoFocus required
                />
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>

              <button type="button" onClick={() => { setStep('login'); setError('') }} className="mt-4 text-sm text-gray-500 hover:text-gray-700 w-full text-center">
                ← Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
