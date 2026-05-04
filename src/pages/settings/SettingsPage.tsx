import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore, themeColors, type ThemeColor, type ThemeMode } from '@/stores/themeStore'
import api from '@/api/client'
import { User, Shield, Key, Mail, Phone, Globe, Sun, Moon, Monitor, Palette, Eye, EyeOff, Check, MessageCircle, Smartphone, X } from 'lucide-react'
import toast from 'react-hot-toast'

const B = '1px solid var(--border-color)'
const ROLES: Record<number, string> = { 1: 'SuperAdmin', 2: 'Admin', 3: 'CompanyAdmin', 4: 'CompanyUser' }
const MFA_METHODS: Record<number, string> = { 0: 'Disabled', 1: 'SMS', 2: 'Email', 3: 'Google Auth' }

export default function SettingsPage() {
  const { user, loadUser } = useAuthStore()
  const { color, mode, setColor, setMode } = useThemeStore()

  // Profile
  const [editField, setEditField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Password
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [showPw, setShowPw] = useState(false)

  // Language
  const [language, setLanguage] = useState('en')

  // MFA
  const [mfaEditing, setMfaEditing] = useState(false)
  const [mfaSaving, setMfaSaving] = useState(false)
  const [mfaResult, setMfaResult] = useState<{ secret?: string; qr_code_uri?: string; message?: string } | null>(null)
  const [gaCode, setGaCode] = useState('')
  const [gaVerifying, setGaVerifying] = useState(false)
  const currentMfa = (user as any)?.mfa_method ?? 0

  // Telegram — all values from API, nothing hardcoded
  const [tgLinked, setTgLinked] = useState(false)
  const [tgLinkedAt, setTgLinkedAt] = useState<string | null>(null)
  const [tgBotUsername, setTgBotUsername] = useState('')

  const tgDeepLink = tgBotUsername ? `https://t.me/${tgBotUsername}?start=${user?.id}` : '#'

  useEffect(() => { if (user) setLanguage((user as any).language || 'en') }, [user])

  // Load Telegram status from backend (reads BotUsername from appsettings)
  useEffect(() => {
    api.get('/Telegram/status').then((r) => {
      setTgLinked(r.data.data.linked)
      setTgLinkedAt(r.data.data.linked_at)
      setTgBotUsername(r.data.data.bot_username || '')
    }).catch(() => {})
  }, [])

  // Profile
  const startEdit = (field: string, value: string) => { setEditField(field); setEditValue(value) }
  const saveField = async () => {
    if (!editField) return; setSaving(true)
    try { await api.put(`/users/${user?.id}`, { [editField]: editValue }); toast.success('Updated'); setEditField(null); loadUser() }
    catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setSaving(false) }
  }

  // Language
  const saveLang = async (val: string) => {
    setLanguage(val)
    try { await api.put(`/users/${user?.id}`, { language: val }); toast.success('Language updated'); loadUser() }
    catch { toast.error('Failed') }
  }

  // Password
  const changePw = async () => {
    if (pwNew !== pwConfirm) { toast.error('Passwords do not match'); return }
    if (pwNew.length < 6) { toast.error('Min 6 characters'); return }
    setPwSaving(true)
    try { await api.post(`/users/${user?.id}/reset-password`, { new_password: pwNew }); toast.success('Password changed'); setPwNew(''); setPwConfirm('') }
    catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setPwSaving(false) }
  }

  // MFA
  const setupMfa = async (method: number) => {
    setMfaSaving(true); setMfaResult(null); setGaCode('')
    try {
      const res = await api.post('/Auth/mfa/setup', { method })
      setMfaResult(res.data.data)
      if (method === 0) { toast.success('MFA disabled'); setMfaEditing(false); loadUser() }
      else if (method !== 3) { toast.success(res.data.data.message || 'MFA enabled'); loadUser() }
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setMfaSaving(false) }
  }

  const verifyGAuth = async () => {
    if (gaCode.length < 6) { toast.error('Enter 6-digit code'); return }
    setGaVerifying(true)
    try {
      const res = await api.post('/Auth/mfa/confirm-gauth', { code: gaCode })
      toast.success(res.data.data.message || 'Verified!'); setMfaResult(null); setMfaEditing(false); setGaCode(''); loadUser()
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Invalid code') }
    finally { setGaVerifying(false) }
  }

  // Telegram
  const unlinkTg = async () => {
    if (!confirm('Unlink Telegram?')) return
    try { await api.post('/Telegram/unlink'); setTgLinked(false); setTgLinkedAt(null); toast.success('Unlinked') }
    catch { toast.error('Failed') }
  }

  const modes: { key: ThemeMode; label: string; icon: any }[] = [
    { key: 'light', label: 'Light', icon: Sun }, { key: 'dark', label: 'Dark', icon: Moon }, { key: 'system', label: 'System', icon: Monitor },
  ]

  const Row = ({ icon: Icon, label, value, field }: { icon: any; label: string; value: string; field?: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: B }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
        <Icon style={{ width: 16, height: 16, opacity: 0.3 }} />
        <span style={{ fontSize: 13, opacity: 0.5 }}>{label}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        {editField === field ? (
          <>
            <input className="input" value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && saveField()} style={{ width: 250, textAlign: 'right', height: 34, fontSize: 13 }} />
            <button onClick={saveField} disabled={saving} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-500)', fontWeight: 700, fontSize: 12 }}>{saving ? '...' : 'Save'}</button>
            <button onClick={() => setEditField(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3, fontSize: 12 }}>Cancel</button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{value || '—'}</span>
            {field && <button onClick={() => startEdit(field, value)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-500)', fontWeight: 600, fontSize: 12 }}>Edit</button>}
          </>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--brand-400), var(--brand-600))' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{user?.name?.charAt(0)?.toUpperCase() ?? 'U'}</span>
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{user?.name}</h1>
          <p style={{ fontSize: 12, opacity: 0.4 }}>@{user?.username} · {ROLES[(user as any)?.role] || ''}</p>
        </div>
      </div>

      {/* ═══ PROFILE ═══ */}
      <div className="card" style={{ padding: '4px 20px', marginBottom: 16 }}>
        <div style={{ padding: '14px 0', borderBottom: B }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <User style={{ width: 15, height: 15, opacity: 0.35 }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.3 }}>Profile</span>
          </div>
        </div>
        <Row icon={User} label="Name" value={user?.name || ''} field="name" />
        <Row icon={Mail} label="Email" value={user?.email || ''} field="email" />
        <Row icon={Phone} label="Phone" value={(user as any)?.phone || ''} field="phone" />
         {((user as any)?.role === 1) && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
            <Shield style={{ width: 16, height: 16, opacity: 0.3 }} />
            <span style={{ fontSize: 13, opacity: 0.5 }}>MFA</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6, backgroundColor: currentMfa ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)', color: currentMfa ? '#10b981' : '#ef4444' }}>
              {MFA_METHODS[currentMfa]}
            </span>
            <button onClick={() => { setMfaEditing(!mfaEditing); setMfaResult(null); setGaCode(''); setTimeout(() => document.getElementById('security-card')?.scrollIntoView({ behavior: 'smooth' }), 100) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-500)', fontWeight: 600, fontSize: 12 }}>
              {mfaEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>
         )}
      </div>

      {/* ═══ ACCOUNT SECURITY ═══ */}
      {((user as any)?.role === 1) && (
      <div id="security-card" className="card" style={{ padding: '4px 20px', marginBottom: 16 }}>
        <div style={{ padding: '14px 0', borderBottom: B }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield style={{ width: 15, height: 15, opacity: 0.35 }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.3 }}>Account Security</span>
          </div>
        </div>

        {/* MFA method picker */}
        {mfaEditing && !mfaResult?.secret && (
          <div style={{ padding: '16px 0', borderBottom: B }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>Choose authentication method</p>
              <button onClick={() => { setMfaEditing(false); setMfaResult(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3, padding: 4 }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { method: 3, label: 'Google Authenticator', desc: 'Time-based codes from authenticator app', icon: Smartphone },
                { method: 2, label: 'Email', desc: `Codes sent to ${user?.email}`, icon: Mail },
                { method: 1, label: 'SMS', desc: `Codes sent to ${(user as any)?.phone || 'your phone'}`, icon: Phone },
                { method: 0, label: 'Disable MFA', desc: 'Not recommended — removes 2FA', icon: X },
              ].map((opt) => {
                const Icon = opt.icon; const active = currentMfa === opt.method
                return (
                  <div key={opt.method} onClick={() => !mfaSaving && setupMfa(opt.method)}
                    style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: 8, cursor: mfaSaving ? 'wait' : 'pointer', backgroundColor: active ? 'color-mix(in srgb, var(--brand-600) 15%, transparent)' : 'var(--bg-input)', border: `1px solid ${active ? 'var(--brand-600)' : 'var(--border-color)'}`, transition: 'all 0.15s', opacity: mfaSaving ? 0.6 : 1 }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--brand-500)' }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--border-color)' }}>
                    <Icon style={{ width: 18, height: 18, marginRight: 12, flexShrink: 0, opacity: active ? 1 : 0.4, color: opt.method === 0 ? '#ef4444' : active ? 'var(--brand-500)' : undefined }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: opt.method === 0 ? '#ef4444' : undefined }}>{opt.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.4, marginTop: 2 }}>{opt.desc}</div>
                    </div>
                    {active && <Check style={{ width: 16, height: 16, color: 'var(--brand-500)', flexShrink: 0 }} />}
                  </div>
                )
              })}
            </div>
            {mfaResult?.message && !mfaResult.secret && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check style={{ width: 16, height: 16, color: '#10b981' }} />
                <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>{mfaResult.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Google Auth QR + Verify */}
        {mfaResult?.secret && (
          <div style={{ padding: '16px 0', borderBottom: B }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone style={{ width: 18, height: 18, color: 'var(--brand-500)' }} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>Setup Google Authenticator</span>
              </div>
              <button onClick={() => { setMfaResult(null); setGaCode('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3, padding: 4 }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            {/* Step 1: QR */}
            <div style={{ padding: 20, borderRadius: 10, backgroundColor: 'var(--bg-input)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'var(--brand-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>1</div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Scan QR Code</span>
              </div>
              <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 14, marginLeft: 32 }}>Open Google Authenticator and scan this code</p>
              {mfaResult.qr_code_uri && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#ffffff' }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaResult.qr_code_uri)}`} alt="QR" style={{ width: 200, height: 200, display: 'block' }} />
                  </div>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, opacity: 0.35, marginBottom: 6 }}>Or enter manually:</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, backgroundColor: 'var(--bg-card)', border: B }}>
                  <code style={{ fontSize: 15, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.2em', color: 'var(--brand-500)' }}>{mfaResult.secret}</code>
                  <button onClick={() => { navigator.clipboard.writeText(mfaResult.secret!); toast.success('Copied!') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-500)', fontSize: 11 }}>Copy</button>
                </div>
              </div>
            </div>
            {/* Step 2: Verify */}
            <div style={{ padding: 20, borderRadius: 10, backgroundColor: 'var(--bg-input)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'var(--brand-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>2</div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Enter Verification Code</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 32 }}>
                <input className="input" value={gaCode} onChange={(e) => setGaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} onKeyDown={(e) => e.key === 'Enter' && verifyGAuth()}
                  style={{ width: 180, textAlign: 'center', fontSize: 24, letterSpacing: '0.4em', fontFamily: 'monospace', height: 50, fontWeight: 700 }} />
                <button onClick={verifyGAuth} disabled={gaVerifying || gaCode.length < 6} className="btn-primary" style={{ height: 50, padding: '0 24px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {gaVerifying ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <><Check style={{ width: 16, height: 16 }} /> Verify</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Telegram ── */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: B }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <MessageCircle style={{ width: 16, height: 16, opacity: 0.3 }} />
            <div>
              <div style={{ fontSize: 13, opacity: 0.5 }}>Telegram Notifications</div>
              <div style={{ fontSize: 10, opacity: 0.25, marginTop: 1 }}>
                {tgLinked ? 'Receiving alerts via Telegram' : 'Link your Telegram to receive alerts'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {tgLinked ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check style={{ width: 14, height: 14, color: '#10b981' }} />
                  <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Linked</span>
                  {tgLinkedAt && <span style={{ fontSize: 10, opacity: 0.3, marginLeft: 4 }}>{new Date(tgLinkedAt).toLocaleDateString()}</span>}
                </div>
                <button onClick={unlinkTg} style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 6, cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <X style={{ width: 12, height: 12 }} /> Unlink
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a href={tgDeepLink} target="_blank" rel="noreferrer"
                  onClick={() => {
                    // After 3 seconds, start checking if linked
                    setTimeout(async () => {
                      try {
                        const res = await api.post('/Telegram/poll-link')
                        if (res.data.data.linked) {
                          setTgLinked(true)
                          setTgLinkedAt(res.data.data.linked_at)
                          toast.success('Telegram linked!')
                        } else {
                          toast('Click Start in Telegram, then try again', { icon: '⏳' })
                        }
                      } catch { toast.error('Failed to check') }
                    }, 5000)
                  }}
                  style={{ fontSize: 12, fontWeight: 600, color: '#0088cc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MessageCircle style={{ width: 13, height: 13 }} /> Press Start to Link
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── Password ── */}
        <div style={{ padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Key style={{ width: 16, height: 16, opacity: 0.3 }} />
            <div>
              <div style={{ fontSize: 13, opacity: 0.5 }}>Login Password</div>
              <div style={{ fontSize: 10, opacity: 0.25, marginTop: 1 }}>Change your account password</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginLeft: 26 }}>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showPw ? 'text' : 'password'} value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="New password" style={{ paddingRight: 40 }} />
              <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }}>
                {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
            <input className="input" type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder="Confirm new password" />
            <button onClick={changePw} disabled={pwSaving || !pwNew || !pwConfirm} className="btn-primary" style={{ alignSelf: 'flex-start', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Key style={{ width: 14, height: 14 }} /> {pwSaving ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>
)}
      {/* ═══ PREFERENCES ═══ */}
      <div className="card" style={{ padding: '4px 20px', marginBottom: 16 }}>
        <div style={{ padding: '14px 0', borderBottom: B }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Palette style={{ width: 15, height: 15, opacity: 0.35 }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.3 }}>Preferences</span>
          </div>
        </div>

        {/* Language */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: B }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
            <Globe style={{ width: 16, height: 16, opacity: 0.3 }} />
            <span style={{ fontSize: 13, opacity: 0.5 }}>Language</span>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[{ key: 'en', label: 'EN' }, { key: 'tr', label: 'TR' }].map((l) => (
                <button key={l.key} onClick={() => saveLang(l.key)}
                  style={{ padding: '5px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', backgroundColor: language === l.key ? 'var(--brand-600)' : 'var(--bg-input)', color: language === l.key ? '#fff' : 'inherit', border: `1px solid ${language === l.key ? 'var(--brand-600)' : 'var(--border-color)'}`, transition: 'all 0.15s' }}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: B }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
            <Sun style={{ width: 16, height: 16, opacity: 0.3 }} />
            <span style={{ fontSize: 13, opacity: 0.5 }}>Appearance</span>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {modes.map((m) => {
                const Icon = m.icon; const a = mode === m.key
                return (
                  <button key={m.key} onClick={() => setMode(m.key)}
                    style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', backgroundColor: a ? 'var(--brand-600)' : 'var(--bg-input)', color: a ? '#fff' : 'inherit', border: `1px solid ${a ? 'var(--brand-600)' : 'var(--border-color)'}`, transition: 'all 0.15s' }}>
                    <Icon style={{ width: 12, height: 12 }} /> {m.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
            <Palette style={{ width: 16, height: 16, opacity: 0.3 }} />
            <span style={{ fontSize: 13, opacity: 0.5 }}>Accent Color</span>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {(Object.entries(themeColors) as [ThemeColor, { name: string; primary: string }][]).map(([key, theme]) => (
              <button key={key} onClick={() => setColor(key)} title={theme.name}
                style={{ width: 26, height: 26, borderRadius: 8, cursor: 'pointer', backgroundColor: theme.primary, border: 'none', boxShadow: color === key ? `0 0 0 2px var(--bg-card), 0 0 0 4px ${theme.primary}` : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {color === key && <Check style={{ width: 12, height: 12, color: '#fff' }} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
