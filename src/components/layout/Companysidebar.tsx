import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { Zap, LogOut, ShieldOff } from 'lucide-react'
import { navGroups } from './Sidebar'

// NOTE: CompanySidebar is only used if you opt back into a sidebar layout.
// CompanyLayout currently uses a top nav bar — this file is kept as a fallback.

export default function CompanySidebar() {
  const location            = useLocation()
  const { user, logout }    = useAuthStore()
  const { canRead, loaded } = usePermissionStore()

  const myRoleId: number          = (user as any)?.role_id ?? (user as any)?.role ?? 4
  const myScope: string           = (user as any)?.role_scope ?? 'own'
  const isCompanyLevel            = myRoleId >= 3 && myScope === 'own'
  const ticketDisallowed: boolean = (user as any)?.tenant_ticket_disallowed ?? false

  const visibleItems = loaded
    ? navGroups.flatMap(g => g.items).filter(item => {
        if (!canRead(item.resource)) return false
        if (item.resource === 'tickets' && ticketDisallowed && isCompanyLevel) return false
        return true
      })
    : []

  return (
    <aside style={{
      width: 56,
      height: '100vh',
      position: 'fixed',
      left: 0, top: 0, zIndex: 30,
      display: 'flex', flexDirection: 'column',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
    }}>

      {/* Logo */}
      <div style={{
        height: 56, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
        }}>
          <Zap style={{ width: 14, height: 14, color: '#fff' }} />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {!loaded ? (
          [1,2,3,4].map(i => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'var(--bg-input)', opacity: 0.3 }} />
          ))
        ) : visibleItems.length === 0 ? (
          <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
            <ShieldOff style={{ width: 18, height: 18, color: '#ef4444', opacity: 0.5 }} />
          </div>
        ) : visibleItems.map(item => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              style={{
                width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, textDecoration: 'none',
                transition: 'all 0.15s',
                backgroundColor: isActive ? 'color-mix(in srgb, var(--brand-600) 18%, transparent)' : 'transparent',
                color: isActive ? 'var(--brand-400)' : 'inherit',
                opacity: isActive ? 1 : 0.45,
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.opacity = '1' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.opacity = '0.45' } }}
            >
              <Icon style={{ width: 17, height: 17 }} />
              {isActive && (
                <div style={{
                  position: 'absolute', right: 3, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 3, borderRadius: '50%',
                  backgroundColor: 'var(--brand-400)',
                }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User avatar + logout */}
      <div style={{
        borderTop: '1px solid var(--border-color)',
        padding: '10px 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <div title={(user as any)?.name ?? 'User'}
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'default',
          }}
        >
          {(user as any)?.name?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
        <button onClick={logout} title="Logout"
          style={{ width: 40, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.3, transition: 'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.3'}
        >
          <LogOut style={{ width: 15, height: 15 }} />
        </button>
      </div>
    </aside>
  )
}
