import { useRef, useState } from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import ThemePicker from '@/components/ui/ThemePicker'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { Bell, ChevronRight, CreditCard, LogOut, Settings, User,MessageSquareMore } from 'lucide-react'
import { navGroups } from './AppLayout'


const routeNames: Record<string, string> = Object.fromEntries(
  navGroups.flatMap(g => g.items.map(item => [item.path, item.label]))
)
// ─── This layout for Company admin and users─────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  { icon: '🚀', text: 'Send Bulk SMS' },
  { icon: '🛡️', text: 'Enterprise-Grade Security' },
  { icon: '💰', text: 'Low-Cost SMS Plans' },
  { icon: '📊', text: 'Real-Time Analytics' },
  { icon: '⚡', text: 'Instant Delivery' },  
]

export default function CompanyLayout() {
  const { user, logout }    = useAuthStore()
  const { canRead, loaded } = usePermissionStore()
  const location            = useLocation()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const myRoleId: number          = (user as any)?.role_id ?? (user as any)?.role ?? 4
  const myScope: string           = (user as any)?.role_scope ?? 'own'
  const isCompanyLevel            = myRoleId >= 3 && myScope === 'own'
  const ticketDisallowed: boolean = (user as any)?.tenant_ticket_disallowed ?? false

  const pathParts   = location.pathname.split('/').filter(Boolean)
  const crumbs      = pathParts.map((_, i) => {
    const path = '/' + pathParts.slice(0, i + 1).join('/')
    return { path, label: routeNames[path] || pathParts[i] }
  })
  const currentPage = crumbs[crumbs.length - 1]?.label ?? 'Dashboard'

  const visibleNavItems = loaded
    ? navGroups.flatMap(g => g.items).filter(item => {
        if (!canRead(item.resource)) return false
        if (item.resource === 'tickets' && ticketDisallowed && isCompanyLevel) return false
        return true
      })
    : []

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-page)' }}>

      {/* ── Top Bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'color-mix(in srgb, var(--bg-header) 90%, transparent)',
        borderBottom: '1px solid var(--border-color)',
      }}>

        {/* ── Row 1: Logo + Marquee + Credits + Theme + Bell + User ── */}
        <div style={{
          height: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', gap: 12,
          borderBottom: '1px solid var(--border-color)',
        }}>

          {/* LEFT — logo + company + current page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
            }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="3" height="10" rx="1" fill="white"/>
                <rect x="6" y="2" width="3" height="10" rx="1" fill="white"/>
                <rect x="1" y="6" width="8" height="2.5" rx="1" fill="white"/>
                <path d="M11 2 Q13.5 2 13.5 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9"/>
                <path d="M11 0 Q14 0 14 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
              </svg>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: 6,
              backgroundColor: 'color-mix(in srgb, var(--brand-600) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--brand-500) 20%, transparent)',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-400)', whiteSpace: 'nowrap' }}>
                {(user as any)?.tenant_name ?? 'Company'}
              </span>
            </div>
            <ChevronRight style={{ width: 11, height: 11, opacity: 0.25, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, whiteSpace: 'nowrap' }}>
              {currentPage}
            </span>
          </div>

          {/* CENTER — Marquee */}
          <div style={{
            flex: 1, overflow: 'hidden',
            maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              animation: 'marquee 24s linear infinite',
              width: 'max-content',
            }}>
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="marquee-item" style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '0 20px',
                    fontSize: 11, fontWeight: 800,
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.04em',
                   
                  }}>
                    <span style={{ fontSize: 12, filter: 'drop-shadow(0 0 4px var(--brand-500))' }}>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                  <span style={{
                    fontSize: 16, fontWeight: 900,
                    color: 'var(--brand-500)',
                    textShadow: '0 0 8px var(--brand-400)',
                    lineHeight: 1, userSelect: 'none', flexShrink: 0,
                  }}>|</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — credits + theme + bell + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: 6,
              backgroundColor: 'color-mix(in srgb, var(--brand-600) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--brand-500) 20%, transparent)',
            }}>
              <CreditCard style={{ width: 11, height: 11, color: 'var(--brand-500)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-500)' }}>
                {(user as any)?.credits?.toLocaleString() ?? 0}
              </span>
            </div>

            <ThemePicker />

            <div style={{ padding: '5px 7px', cursor: 'pointer', opacity: 0.45, transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.45'}>
              <Bell style={{ width: 15, height: 15 }} />
            </div>

            <div ref={menuRef} style={{ position: 'relative' }}>
              <div onClick={() => setUserMenuOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '3px 9px 3px 4px', borderRadius: 7, cursor: 'pointer',
                  backgroundColor: userMenuOpen ? 'var(--bg-hover)' : 'transparent',
                  border: '1px solid var(--border-color)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!userMenuOpen) e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!userMenuOpen) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: '#fff',
                  background: 'linear-gradient(135deg, var(--brand-400), var(--brand-600))',
                }}>
                  {(user as any)?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1 }}>{(user as any)?.name ?? 'User'}</div>
                  <div style={{ fontSize: 9, opacity: 0.4, lineHeight: 1, marginTop: 2 }}>{(user as any)?.tenant_name ?? ''}</div>
                </div>
              </div>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 42, width: 220,
                  borderRadius: 10, backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
                  overflow: 'hidden', zIndex: 50,
                }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{(user as any)?.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.45, marginTop: 2 }}>{(user as any)?.email}</div>
                  </div>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CreditCard style={{ width: 14, height: 14, opacity: 0.4 }} />
                      <span style={{ fontSize: 12, opacity: 0.55 }}>Credits</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-500)' }}>
                      {(user as any)?.credits?.toLocaleString() ?? 0}
                    </span>
                  </div>
                 <div style={{ padding: 6 }}>
                        <DropItem icon={<User style={{ width: 14, height: 14 }} />} label="My Profile" onClick={() => { setUserMenuOpen(false); navigate('/settings') }} />
                        <DropItem icon={<LogOut style={{ width: 14, height: 14 }} />} label="Sign Out"
                      color="#ef4444" hoverBg="rgba(239,68,68,0.08)"
                      onClick={() => { setUserMenuOpen(false); logout() }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav bar — outside header, centered in a bordered box ── */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        padding: '8px 20px',
        backgroundColor: 'var(--bg-page)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          gap: 2, padding: '3px',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          backgroundColor: 'var(--bg-card)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {!loaded ? (
            [1,2,3,4].map(i => (
              <div key={i} style={{ width: 80, height: 28, borderRadius: 8, backgroundColor: 'var(--bg-input)', opacity: 0.4, animation: 'pulse 1.5s ease infinite' }} />
            ))
          ) : visibleNavItems.map(item => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
            const Icon = item.icon
            return (
              <Link key={item.path} to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 9,
                  fontSize: 11, fontWeight: isActive ? 700 : 400,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                  color: isActive ? '#fff' : 'inherit',
                  backgroundColor: isActive ? 'var(--brand-600)' : 'transparent',
                  opacity: isActive ? 1 : 0.55,
                  transition: 'all 0.15s',
                  boxShadow: isActive ? '0 2px 8px color-mix(in srgb, var(--brand-600) 40%, transparent)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.opacity = '0.55'; e.currentTarget.style.backgroundColor = 'transparent' } }}
              >
                <Icon style={{ width: 12, height: 12, flexShrink: 0 }} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

   <main style={{ flex: 1, overflowY: 'auto', padding: '20px 40px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      <Outlet />
    </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .marquee-item { color: #111827; }
        .dark .marquee-item { color: #ffffff; }
      `}</style>
      {/* ═══ FOOTER ═══ */}
      <footer style={{
        height: 36, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        backgroundColor: 'var(--bg-header)',
        borderTop: '1px solid var(--border-color)',
        fontSize: 10,
        color: 'var(--text-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))' }}>
            <MessageSquareMore style={{ width: 10, height: 10, color: '#fff' }} />
          </div>
          <span style={{ fontWeight: 700 }}>
            <span style={{ color: 'var(--brand-400)' }}>KKTC</span>
            <span style={{ opacity: 0.5 }}> SMS</span>
          </span>
        </div>
        <span style={{ opacity: 0.4 }}>© {new Date().getFullYear()} KKTC SMS. All rights reserved.</span>
        <a href="https://t.me/hilspay" target="_blank" rel="noopener noreferrer"
          style={{ opacity: 0.4, color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}>
          t.me/kktcpay
        </a>
      </footer>
    </div>
  )
}

function DropItem({ icon, label, onClick, color, hoverBg }: {
  icon: React.ReactNode; label: string; onClick: () => void; color?: string; hoverBg?: string
}) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: color ?? 'inherit', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg ?? 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
      {icon}<span>{label}</span>
    </div>
  )
}
