import { create } from 'zustand'
import api from '@/api/client'

export interface Permission {
  id: number
  resource: string
  can_read: boolean
  can_create: boolean
  can_update: boolean
  can_delete: boolean
}

interface PermissionState {
  permissions: Permission[]
  loaded: boolean
  loadPermissions: () => Promise<void>
  canRead: (resource: string) => boolean
  canCreate: (resource: string) => boolean
  canUpdate: (resource: string) => boolean
  canDelete: (resource: string) => boolean
  clear: () => void
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: [],
  loaded: false,

  loadPermissions: async () => {
    try {
      const res = await api.get('/roles/my-permissions')     
      set({ permissions: res.data.data ?? [], loaded: true })
    } catch {
      set({ permissions: [], loaded: true })
    }
  },

  canRead: (resource) => {
    const perm = get().permissions.find((p) => p.resource === resource)
    return perm?.can_read ?? false
  },

  canCreate: (resource) => {
    const perm = get().permissions.find((p) => p.resource === resource)
    return perm?.can_create ?? false
  },

  canUpdate: (resource) => {
    const perm = get().permissions.find((p) => p.resource === resource)
    return perm?.can_update ?? false
  },

  canDelete: (resource) => {
    const perm = get().permissions.find((p) => p.resource === resource)
    return perm?.can_delete ?? false
  },

  clear: () => set({ permissions: [], loaded: false }),
}))
