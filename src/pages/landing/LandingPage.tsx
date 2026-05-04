import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  MessageSquareMore, Shield, Zap, BarChart3, Globe, Users, Clock,
  Eye, EyeOff, Lock, Check, Smartphone, MessageSquare, Send,
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const { login, verifyMfa } = useAuthStore()
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'platform'>('home')
  useEffect(() => { setTimeout(() => setLoaded(true), 100) }, [])

  // ─── Login state ────────────────────────────────────────────────────────
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

  // ─── Marquee items ──────────────────────────────────────────────────────

  const MARQUEE_ITEMS = [
    { icon: '🚀', text: 'Send Bulk SMS' },
    { icon: '🛡️', text: 'Enterprise-Grade Security' },
    { icon: '💰', text: 'Low-Cost SMS Plans' },
    { icon: '📊', text: 'Real-Time Analytics' },
    { icon: '⚡', text: 'Instant Delivery' },
    { icon: '🌍', text: '150+ Countries' },
    { icon: '📱', text: 'OTP & Transactional' },
    { icon: '🔗', text: 'Short URL Tracking' },
  ]

  // ─── Data ───────────────────────────────────────────────────────────────

  const features = [
    { icon: Zap, title: 'Lightning Fast', desc: 'Parallel processing engine for millions of messages.', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: Shield, title: 'Enterprise Security', desc: 'MFA, encryption, and role-based access control.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Live delivery tracking and engagement metrics.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Globe, title: 'Multi-Tenant', desc: 'Isolated companies with independent pricing.', color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { icon: Users, title: 'Team Management', desc: 'SuperAdmin, Admin, CompanyAdmin, CompanyUser.', color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { icon: Clock, title: 'Scheduled Delivery', desc: 'Plan campaigns with precise scheduling.', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  ]

  const capabilities = [
    'Bulk SMS Broadcasting', 'OTP & Transactional SMS', 'Short URL + Click Tracking',
    'Phonebook Management', 'Message Templates', 'Blacklist & Banlist',
    'Credit Management', 'Delivery Reports', 'API Integration', 'Multi-Gateway Support',
  ]

  // ─── Left content renderer ─────────────────────────────────────────────

  const renderLeft = () => {
    switch (activeTab) {
      case 'features':
        return (
          <div className="h-full flex flex-col">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-500 mb-2">Features</p>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">Everything You Need to Scale</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 flex-1 content-start">
              {features.map((f, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all duration-200">
                  <div className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center mb-3`}>
                    <f.icon className={`w-4 h-4 ${f.color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case 'platform':
        return (
          <div className="h-full flex flex-col">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-500 mb-2">Platform</p>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mb-3">Complete SMS Solution</h2>
              <p className="text-sm text-gray-400 leading-relaxed max-w-md">
                From your first message to managing millions — one platform for bulk campaigns, OTP, and transactional messaging.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1 content-start">
              {capabilities.map((cap, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <Check className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                  <span className="text-xs text-gray-300 font-medium">{cap}</span>
                </div>
              ))}
            </div>
            {/* How it works mini */}
            <div className="flex gap-4 mt-5 pt-5 border-t border-white/5">
              {[
                { step: '01', icon: Smartphone, label: 'Upload' },
                { step: '02', icon: MessageSquare, label: 'Compose' },
                { step: '03', icon: Send, label: 'Send' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/20">
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] text-brand-400 font-bold">{s.step}</div>
                    <div className="text-xs text-white font-semibold">{s.label}</div>
                  </div>
                  {i < 2 && <div className="text-gray-600 ml-2">→</div>}
                </div>
              ))}
            </div>
          </div>
        )

      default: // home
        return (
          <div className="h-full flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-5 w-fit">
              <Zap className="w-3 h-3" />
              High-Performance SMS Platform
            </div>

            <h1 className="text-3xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-4">
              Send Millions of{' '}
              <span className="text-brand-400">Messages</span>{' '}
              in Minutes
            </h1>

            <p className="text-sm lg:text-base text-gray-400 mb-8 leading-relaxed max-w-md">
              Enterprise-grade bulk SMS platform with real-time delivery tracking,
              multi-tenant management, and lightning-fast gateway integration.
            </p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-8">
              {[
                { icon: Zap, label: 'Lightning Fast Delivery' },
                { icon: Shield, label: 'Enterprise Security' },
                { icon: BarChart3, label: 'Real-Time Analytics' },
                { icon: Globe, label: '150+ Countries' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-gray-400">
                  <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  {f.label}
                </div>
              ))}
            </div>

            <div className="flex gap-8">
              {[
                { value: '3M+', label: 'Msgs/Hour' },
                { value: '99.9%', label: 'Uptime' },
                { value: '24/7', label: 'Support' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-xl lg:text-2xl font-extrabold text-brand-400 tracking-tight">{s.value}</div>
                  <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-brand-950 via-gray-900 to-gray-950 flex flex-col">

      {/* ═══ NAV: Logo | Marquee | Tabs ═══ */}
      <nav className="flex items-center px-8 py-3 border-b border-white/5 flex-shrink-0 gap-4">
        {/* Left — Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
            <MessageSquareMore className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
           KKTC<span className="text-brand-500">SMS</span>
          </span>
        </div>

        {/* Center — Marquee */}
        <div style={{
          flex: 1, overflow: 'hidden',
          maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            animation: 'marquee 30s linear infinite',
            width: 'max-content',
          }}>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0 18px', fontSize: 11, fontWeight: 700,
                  whiteSpace: 'nowrap', letterSpacing: '0.03em',
                  color: 'rgba(255,255,255,0.35)',
                }}>
                  <span style={{ fontSize: 12 }}>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'rgba(13,148,136,0.4)', lineHeight: 1, userSelect: 'none', flexShrink: 0 }}>|</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Tabs */}
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1 flex-shrink-0">
          {[
            { key: 'home', label: 'Home' },
            { key: 'features', label: 'Features' },
            { key: 'platform', label: 'Platform' },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-gray-400 hover:text-white'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ═══ MAIN ═══ */}
      <div className="flex-1 flex items-stretch px-8 md:px-12 lg:px-16 py-6 relative overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 30% 40%, rgba(13,148,136,0.08) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Floating bubbles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
          {[
            { text: '✓ Delivered', x: '3%', y: '18%', d: '0s' },
            { text: '⚡ Instant', x: '44%', y: '10%', d: '2s' },
            { text: '🚀 Bulk Ready', x: '5%', y: '85%', d: '3.5s' },
          ].map((b, i) => (
            <div key={i} className="absolute px-3 py-1.5 rounded-full bg-brand-500/5 border border-brand-500/10 text-xs text-gray-600 font-medium"
              style={{ left: b.x, top: b.y, animation: 'floatBubble 6s ease-in-out infinite', animationDelay: b.d }}>
              {b.text}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className={`relative z-10 w-full max-w-6xl mx-auto grid md:grid-cols-[1fr,380px] gap-10 lg:gap-16 items-stretch transition-all duration-500 ease-out ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

          {/* ── Left: Switchable content ── */}
          <div className="flex flex-col justify-center min-h-0">
            <div key={activeTab} className="animate-fadeIn">
              {renderLeft()}
            </div>
          </div>

          {/* ── Right: Login Card (always visible) ── */}
          <div className="flex flex-col justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-7">
              {step === 'login' ? (
                <form onSubmit={handleLogin}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sign In</h2>
                      <p className="text-xs text-gray-400">Access your dashboard</p>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-2.5 rounded-lg mb-4">{error}</div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                      <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                        className="input" placeholder="Enter your username" autoFocus required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                          className="input pr-10" placeholder="Enter your password" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 font-semibold">
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </div>

                  <div className="mt-4 text-center">
                    <a href="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700">Forgot password?</a>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleMfa}>
                  <div className="text-center mb-5">
                    <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-6 h-6 text-brand-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Two-Factor Auth</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {mfaMethod === 'GoogleAuth' ? 'Enter code from your Authenticator app' :
                       mfaMethod === 'Sms' ? 'Enter the code sent to your phone' :
                       'Enter the code sent to your email'}
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-2.5 rounded-lg mb-4">{error}</div>
                  )}

                  <div className="space-y-4">
                    <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                      className="input text-center text-2xl tracking-[0.5em] font-mono"
                      placeholder="000000" maxLength={6} autoFocus required />
                    <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 font-semibold">
                      {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                  </div>

                  <button type="button" onClick={() => { setStep('login'); setError('') }}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700 w-full text-center">
                    ← Back to login
                  </button>
                </form>
              )}
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-5 mt-4">
              {[
                { icon: Shield, label: 'SSL Secured' },
                { icon: Lock, label: 'MFA Protected' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <t.icon className="w-3 h-3 text-brand-500" />
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="flex items-center justify-between px-8 py-3 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
            <MessageSquareMore className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-semibold text-white">KKTC<span className="text-brand-500">SMS</span></span>
        </div>
        <span className="text-[10px] text-gray-600">© {new Date().getFullYear()} KKTC SMS. All rights reserved.</span>
        <a href="https://t.me/hilspay" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-white transition-colors no-underline">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          t.me/kktcsms
        </a>
      </footer>

      {/* ═══ CSS ═══ */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes floatBubble {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-15px); opacity: 0.6; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}
