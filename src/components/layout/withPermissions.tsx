import { usePermissionStore } from '@/stores/permissionStore'
import { ShieldOff } from 'lucide-react'

export interface PagePermissions {
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export function withPermissions(resource: string, Component: React.ComponentType<{ perms: PagePermissions }>) {
  return function PermissionWrapped() {
    const store = usePermissionStore()

    if (!store.loaded) return null

    if (!store.canRead(resource)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, opacity: 0.4 }}>
          <ShieldOff style={{ width: 40, height: 40 }} />
          <p style={{ fontSize: 16, fontWeight: 700 }}>Access Denied</p>
          <p style={{ fontSize: 13 }}>Your role does not have permission to view this page.</p>
        </div>
      )
    }

    const perms: PagePermissions = {
      canRead:   store.canRead(resource),
      canCreate: store.canCreate(resource),
      canUpdate: store.canUpdate(resource),
      canDelete: store.canDelete(resource),
    }

    return <Component perms={perms} />
  }
}