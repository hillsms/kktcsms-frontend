import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquareMore, Mail, KeyRound, ArrowLeft, Check, Eye, EyeOff } from 'lucide-react'
import api from '@/api/client'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email.trim()) { setError('Email is required'); return }
    setLoading(true)
    try {
      await api.post('/auth/password/reset', { email: email.trim() })
      setSuccess('If this email exists, a reset code has been sent. Check your inbox.')
      setStep('reset')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!code.trim()) { setError('Reset code is required'); return }
    if (!newPassword) { setError('New password is required'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await api.post('/auth/password/reset/confirm', {
        email: email.trim(),
        code: code.trim(),
        new_password: newPassword,
      })
      setSuccess('Password reset successfully! Redirecting to login...')
      setTimeout(() => navigate('/'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to reset password')
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
            <MessageSquareMore className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">KKTC SMS</h1>
          <p className="text-gray-400 mt-1">Reset your password</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          {step === 'email' ? (
            <form onSubmit={handleRequestReset}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Forgot Password</h2>
                  <p className="text-xs text-gray-400">Enter your email to receive a reset code</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-2.5 rounded-lg mb-4">{error}</div>
              )}
              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm px-4 py-2.5 rounded-lg mb-4 flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" /> {success}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="input" placeholder="Enter your registered email" autoFocus required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 font-semibold">
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <button type="button" onClick={() => navigate('/')}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reset Password</h2>
                  <p className="text-xs text-gray-400">Enter the code sent to your email</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-2.5 rounded-lg mb-4">{error}</div>
              )}
              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm px-4 py-2.5 rounded-lg mb-4 flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" /> {success}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reset Code</label>
                  <input type="text" value={code} onChange={e => setCode(e.target.value)}
                    className="input text-center text-xl tracking-[0.3em] font-mono"
                    placeholder="Enter code" maxLength={6} autoFocus required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      className="input pr-10" placeholder="Enter new password" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="input" placeholder="Confirm new password" required />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 font-semibold">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>

              <div className="mt-4 flex justify-between">
                <button type="button" onClick={() => { setStep('email'); setError(''); setSuccess('') }}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Change email
                </button>
                <button type="button" onClick={handleRequestReset}
                  className="text-sm text-brand-600 hover:text-brand-700">
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
