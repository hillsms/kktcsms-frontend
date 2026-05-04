import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import {
  LayoutDashboard, Send, Building2, Users, Shield, CreditCard,
  MessageSquare, Settings, Zap, ChevronLeft, ChevronRight,
  Upload, Activity, UserCheck, Link2, ShieldOff, LogOut,
  ShieldBan,BookOpen,FileText
} from 'lucide-react'

// ─────────────────────────────────────────────
// NAV DEFINITION  
//This add dynamically from the db based on the canRead permission settings to the ALL_RESOURCES for the Roles page
//  the withPermissions wrapper in App.tsx
 
export const navGroups = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard',   label: 'Dashboard', icon: LayoutDashboard, resource: 'dashboard' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { path: '/orders',        label: 'Orders',        icon: Send,          resource: 'orders' },
      { path: '/companies',     label: 'Companies',     icon: Building2,     resource: 'companies' },
      { path: '/company-users', label: 'Company Users', icon: UserCheck,     resource: 'company_users', placeholder: true },
      { path: '/shorturl',      label: 'Short URL',     icon: Link2,         resource: 'shorturl' },
      { path: '/pricing',       label: 'Pricing',       icon: CreditCard,    resource: 'pricing' },
      { path: '/api-config',    label: 'API',           icon: Zap,           resource: 'api_config' },
      { path: '/tickets',       label: 'Tickets',       icon: MessageSquare, resource: 'tickets' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { path: '/credit-uploads', label: 'Credit Uploads', icon: Upload,   resource: 'credit_uploads' },
      { path: '/activity-log',   label: 'Activity Log',   icon: Activity, resource: 'activity_log',  placeholder: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/users',    label: 'Users',    icon: Users,    resource: 'users' },
      { path: '/roles',    label: 'Roles',    icon: Shield,   resource: 'roles' },
      { path: '/phonebooks', label: 'Phonebooks', icon: BookOpen, resource: 'phonebooks' },
      { path: '/blacklist', label: 'Blacklist', icon: ShieldBan, resource: 'blacklist' },     
      { path: '/templates', label: 'Templates', icon: FileText, resource: 'templates' },
    ],
  },
]

// ─────────────────────────────────────────────
// ALL_RESOURCES — derived from navGroups.
// Imported by RolesPage to build the permissions
// grid with zero hardcoding.
// ─────────────────────────────────────────────
export const ALL_RESOURCES = navGroups
  .flatMap((g) => g.items)
  .map((item) => item.resource)

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────
export default function Sidebar() {
  const location            = useLocation()
  const { user, logout }    = useAuthStore()   // ← user added
  const { canRead }         = usePermissionStore()
  const [collapsed, setCollapsed] = useState(false)

  // ── Ticket disallowed — only hides for company-level users ──────────────
  // SuperAdmin (1)  
  // CompanyAdmin (3) / CompanyUser (4+) → isCompanyLevel = true → hide 
  const myRoleId: number          = (user as any)?.role_id ?? (user as any)?.role ?? 4
const myScope: string           = (user as any)?.role_scope ?? 'own'
const isCompanyLevel            = myRoleId >= 3 && myScope === 'own'  //  company scope to check
const ticketDisallowed: boolean = (user as any)?.tenant_ticket_disallowed ?? false

  const hasAnyMenu = navGroups.some((g) =>
    g.items.some((item) => canRead(item.resource))
  )

  return (
    <aside style={{
      width: collapsed ? 56 : 220,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0, top: 0, zIndex: 30,
      transition: 'width 0.25s ease',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
    }}>

      {/* ── Logo ── */}
      <div style={{
        height: 56, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: collapsed ? '0 12px' : '0 14px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
          }}>
            <Zap style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          {!collapsed && (
            <span style={{ fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>
              <span style={{ color: 'var(--brand-400)' }}>KKTC</span>
              <span style={{ opacity: 0.5 }}> SMS</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.4, display: 'flex', alignItems: 'center' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
        >
          {collapsed
            ? <ChevronRight style={{ width: 15, height: 15 }} />
            : <ChevronLeft  style={{ width: 15, height: 15 }} />}
        </button>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {!hasAnyMenu ? (

          <div style={{
            margin: '16px 4px', padding: '16px 12px', borderRadius: 10,
            textAlign: 'center',
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <ShieldOff style={{ width: 22, height: 22, color: '#ef4444', margin: '0 auto 8px', opacity: 0.7 }} />
            {!collapsed && (
              <p style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, lineHeight: 1.5 }}>
                No permissions enabled for your role
              </p>
            )}
          </div>

        ) : navGroups.map((group) => {

          // ── Filter: permission check + ticket disallowed (company-level only) ──
          const visibleItems = group.items.filter((item) => {
            if (!canRead(item.resource)) return false
            if (item.resource === 'tickets' && ticketDisallowed && isCompanyLevel) return false
            return true
          })

          if (visibleItems.length === 0) return null

          return (
            <div key={group.label} style={{ marginBottom: 16 }}>
              {!collapsed && (
                <p style={{
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.1em', opacity: 0.3, marginBottom: 4, paddingLeft: 10,
                }}>
                  {group.label}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {visibleItems.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: collapsed ? '9px 0' : '9px 10px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        borderRadius: 8, fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        textDecoration: 'none',
                        transition: 'background 0.15s',
                        backgroundColor: isActive
                          ? 'color-mix(in srgb, var(--brand-600) 18%, transparent)'
                          : 'transparent',
                        color: isActive ? 'var(--brand-400)' : 'inherit',
                        borderLeft: isActive ? '3px solid var(--brand-500)' : '3px solid transparent',
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                      {!collapsed && (
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

    </aside>
  )
}
