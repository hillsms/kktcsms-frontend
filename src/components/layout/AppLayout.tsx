import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation, Link ,useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import ThemePicker from '@/components/ui/ThemePicker'
import {
  Bell, ChevronRight, Home, ChevronDown, LogOut, User, CreditCard,
  LayoutDashboard, Send, Building2, Users, Shield, MessageSquare,
  Settings, Zap, ChevronLeft, Upload, Activity, UserCheck, Link2,
  ShieldOff, ShieldBan, BookOpen, FileText, MessageSquareMore,
} from 'lucide-react'

// ─── Nav Groups This layout for superadmin─────────────────────────────────────────────────────────────

export const navGroups = [
  {
    label: 'Operations',
    items: [
      { path: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, resource: 'dashboard' },
      { path: '/orders',        label: 'Orders',        icon: Send,            resource: 'orders' },
      { path: '/companies',     label: 'Companies',     icon: Building2,       resource: 'companies' },
      { path: '/company-users', label: 'Company Users', icon: UserCheck,       resource: 'company_users' },
      { path: '/shorturl',      label: 'Short URL',     icon: Link2,           resource: 'shorturl' },
      { path: '/pricing',       label: 'Pricing',       icon: CreditCard,      resource: 'pricing' },
      { path: '/api-config',    label: 'API',           icon: Zap,             resource: 'api_config' },
      { path: '/tickets',       label: 'Tickets',       icon: MessageSquare,   resource: 'tickets' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/phonebooks', label: 'Phonebooks', icon: BookOpen,  resource: 'phonebooks' },
      { path: '/templates',  label: 'Templates',  icon: FileText,  resource: 'templates' },
      { path: '/blacklist',  label: 'Blacklist',  icon: ShieldBan, resource: 'blacklist' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { path: '/credit-uploads', label: 'Credit Uploads', icon: Upload,   resource: 'credit_uploads' },
      { path: '/activity-log',   label: 'Activity Log',   icon: Activity, resource: 'activity_log' },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/users',    label: 'Users',    icon: Users,    resource: 'users' },
      { path: '/roles',    label: 'Roles',    icon: Shield,   resource: 'roles' },     
    ],
  },
]

export const ALL_RESOURCES = navGroups.flatMap(g => g.items).map(item => item.resource)

const routeNames: Record<string, string> = Object.fromEntries(
  navGroups.flatMap(g => g.items.map(item => [item.path, item.label]))
)

const MARQUEE_ITEMS = [
  { icon: '🚀', text: 'Send Bulk SMS' },
  { icon: '🛡️', text: 'Enterprise-Grade Security' },
  { icon: '💰', text: 'Low-Cost SMS Plans' },
  { icon: '📊', text: 'Real-Time Analytics' },
  { icon: '⚡', text: 'Instant Delivery' },
]

// ─── Main Layout ────────────────────────────────────────────────────────────

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const { canRead } = usePermissionStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Breadcrumbs
  const pathParts = location.pathname.split('/').filter(Boolean)
  const crumbs = pathParts.map((_, i) => {
    const path = '/' + pathParts.slice(0, i + 1).join('/')
    return { path, label: routeNames[path] || pathParts[i] }
  })

  // Ticket visibility
  const myRoleId: number = (user as any)?.role_id ?? (user as any)?.role ?? 4
  const myScope: string = (user as any)?.role_scope ?? 'own'
  const isCompanyLevel = myRoleId >= 3 && myScope === 'own'
  const ticketDisallowed: boolean = (user as any)?.tenant_ticket_disallowed ?? false

  const sidebarWidth = collapsed ? 56 : 220

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-page)' }}>

      {/* ═══ FIXED HEADER ═══ */}
      <header style={{
        height: 50, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        backgroundColor: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-color)',
        zIndex: 40,
        gap: 16,
      }}>
        {/* Left — Logo + Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
            }}>
              <MessageSquareMore style={{ width: 15, height: 15, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>
              <span style={{ color: 'var(--brand-400)' }}>KKTC</span>
              <span style={{ opacity: 0.5 }}> SMS</span>
            </span>
          </div>

          <div style={{ width: 1, height: 20, backgroundColor: 'var(--border-color)', flexShrink: 0 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Home style={{ width: 13, height: 13, opacity: 0.4 }} />
            {crumbs.map((c, i) => (
              <div key={c.path} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronRight style={{ width: 11, height: 11, opacity: 0.3 }} />
                <span style={{
                  fontWeight: i === crumbs.length - 1 ? 600 : 400,
                  opacity: i === crumbs.length - 1 ? 1 : 0.5,
                  color: i === crumbs.length - 1 ? 'var(--brand-500)' : undefined,
                  whiteSpace: 'nowrap',
                }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center — Marquee */}
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
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '0 20px', fontSize: 11, fontWeight: 800,
                  whiteSpace: 'nowrap', letterSpacing: '0.04em',
                }}>
                  <span style={{ fontSize: 13, filter: 'drop-shadow(0 0 4px var(--brand-500))' }}>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-500)', textShadow: '0 0 8px var(--brand-400)', lineHeight: 1, userSelect: 'none', flexShrink: 0 }}>|</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Theme + Bell + User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <ThemePicker />

          <div style={{ position: 'relative', padding: 8, cursor: 'pointer' }}>
            <Bell style={{ width: 16, height: 16, opacity: 0.5 }} />
            <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: 'var(--brand-500)' }} />
          </div>

          {/* User menu */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <div onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 10px', borderRadius: 10, cursor: 'pointer',
                backgroundColor: userMenuOpen ? 'var(--bg-hover)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!userMenuOpen) e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
              onMouseLeave={e => { if (!userMenuOpen) e.currentTarget.style.backgroundColor = 'transparent' }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 11, fontWeight: 700,
                background: 'linear-gradient(135deg, var(--brand-400), var(--brand-600))',
              }}>
                {user?.name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1 }}>{user?.name || 'User'}</div>
                <div style={{ fontSize: 10, opacity: 0.4, lineHeight: 1, marginTop: 2 }}>{user?.tenant_name || 'KKTC SMS'}</div>
              </div>
              <ChevronDown style={{ width: 13, height: 13, opacity: 0.4 }} />
            </div>

            {userMenuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 44, width: 256,
                borderRadius: 12, backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                overflow: 'hidden', zIndex: 50,
              }}>
                <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    background: 'linear-gradient(135deg, var(--brand-400), var(--brand-600))',
                  }}>
                    {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{user?.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.5 }}>{user?.email}</div>
                  </div>
                </div>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard style={{ width: 16, height: 16, opacity: 0.5 }} />
                    <span style={{ fontSize: 12, opacity: 0.6 }}>Credits</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-500)' }}>
                    {user?.credits?.toLocaleString() ?? 0}
                  </span>
                </div>
                <div style={{ padding: 8 }}>
                  <DropdownItem icon={<User style={{ width: 16, height: 16, opacity: 0.5 }} />} label="My Profile" onClick={() => { setUserMenuOpen(false); navigate('/settings') }} />
                  <DropdownItem icon={<LogOut style={{ width: 16, height: 16 }} />} label="Sign Out" color="#ef4444" hoverBg="rgba(239,68,68,0.1)"
                    onClick={() => { setUserMenuOpen(false); logout() }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ MIDDLE: SIDEBAR + CONTENT ═══ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: sidebarWidth, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          transition: 'width 0.25s ease',
          overflow: 'hidden',
        }}>
          {/* Nav items — collapsible groups */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
            {navGroups.map(group => {
              const visibleItems = group.items.filter(item => {
                if (!canRead(item.resource)) return false
                if (item.resource === 'tickets' && ticketDisallowed && isCompanyLevel) return false
                return true
              })
              if (visibleItems.length === 0) return null

              return (
                <NavGroup key={group.label} label={group.label} sidebarCollapsed={collapsed}>
                  {visibleItems.map(item => {
                    const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                    const Icon = item.icon
                    return (
                      <Link key={item.path} to={item.path} title={collapsed ? item.label : undefined}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: collapsed ? '9px 0' : '9px 10px',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          borderRadius: 8, fontSize: 13,
                          fontWeight: isActive ? 700 : 500, textDecoration: 'none',
                          transition: 'background 0.15s',
                          backgroundColor: isActive ? 'color-mix(in srgb, var(--brand-600) 18%, transparent)' : 'transparent',
                          color: isActive ? 'var(--brand-400)' : 'inherit',
                          borderLeft: isActive ? '3px solid var(--brand-500)' : '3px solid transparent',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}>
                        <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                        {!collapsed && (
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                        )}
                      </Link>
                    )
                  })}
                </NavGroup>
              )
            })}
          </nav>

          {/* Collapse toggle — bottom */}
          <div style={{
            padding: collapsed ? '10px 0' : '10px 12px',
            display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end',
            borderTop: '1px solid var(--border-color)',
            flexShrink: 0,
          }}>
            <button onClick={() => setCollapsed(!collapsed)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.4, display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}>
              {collapsed ? <ChevronRight style={{ width: 15, height: 15 }} /> : <ChevronLeft style={{ width: 15, height: 15 }} />}
            </button>
          </div>
        </aside>

        {/* ── Scrollable Content ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <Outlet />
        </main>
      </div>

      {/* ═══ FIXED FOOTER ═══ */}
      <footer style={{
        height: 36, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        backgroundColor: 'var(--bg-header)',
        borderTop: '1px solid var(--border-color)',
        fontSize: 10,
        color: 'var(--text-secondary)',
        zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
          }}>
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
          t.me/kktc
        </a>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

// ─── NavGroup (collapsible) ─────────────────────────────────────────────────

function NavGroup({ label, sidebarCollapsed, children }: { label: string; sidebarCollapsed: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)

  // When sidebar is collapsed, always show items (icons only, no group headers)
  if (sidebarCollapsed) {
    return <div style={{ marginBottom: 8 }}>{children}</div>
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px', cursor: 'pointer', borderRadius: 6,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
        <span style={{
          fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.08em', opacity: 0.4,
        }}>
          {label}
        </span>
        <ChevronDown style={{
          width: 14, height: 14, opacity: 0.3,
          transition: 'transform 0.2s',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
        }} />
      </div>
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? '500px' : '0px',
        transition: 'max-height 0.25s ease',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── DropdownItem ───────────────────────────────────────────────────────────

function DropdownItem({ icon, label, onClick, color, hoverBg }: {
  icon: React.ReactNode; label: string; onClick: () => void; color?: string; hoverBg?: string
}) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: color ?? 'inherit', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg ?? 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
      {icon}
      <span>{label}</span>
    </div>
  )
}
