import { useEffect, useState } from 'react'
import api from '@/api/client'
import { Shield, Plus, Save, Trash2, Lock, Edit2, Globe, Building2, Users2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ALL_RESOURCES } from '@/components/layout/Sidebar'
import type { PagePermissions } from '@/components/layout/withPermissions'

// ─── Types ───────────────────────────────────
interface RoleItem {
  id: number; tenant_id: number; name: string
  read_only: boolean; scope: string; created_at: string
}
interface PermItem {
  id: number; resource: string
  can_read: boolean; can_create: boolean; can_update: boolean; can_delete: boolean
}
interface PermGroup { role_id: number; role_name: string; permissions: PermItem[] }

// ─── Constants ───────────────────────────────
const ROLE_COLORS: Record<number, string> = { 1: '#ef4444', 2: '#f59e0b', 3: '#8b5cf6', 4: '#3b82f6' }

const SCOPE_OPTIONS = [
  { value: 'all',      label: 'All Companies',      desc: 'Access every company in the system',          icon: Globe,     color: '#10b981' },
  { value: 'own',      label: 'Own Company Only',   desc: 'Restricted to their own tenant only',          icon: Building2, color: 'var(--brand-500)' },
  { value: 'assigned', label: 'Assigned Companies', desc: 'Only companies explicitly assigned to the user', icon: Users2,  color: '#f59e0b' },
]

const getDefaultPerms = (): PermItem[] =>
  ALL_RESOURCES.map((r) => ({
    id: 0, resource: r,
    can_read: false, can_create: false, can_update: false, can_delete: false,
  }))

// ─── Main ─────────────────────────────────────
export default function RolesPage({ perms }: { perms: PagePermissions }) {
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedScope, setSelectedScope] = useState<string>('all')

  const [permGroups, setPermGroups] = useState<PermGroup[]>([])
  const [permLoading, setPermLoading] = useState(true)
  const [permSaving, setPermSaving] = useState(false)
  const [scopeSaving, setScopeSaving] = useState(false)

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editRole, setEditRole] = useState<RoleItem | null>(null)
  const [roleName, setRoleName] = useState('')
  const [modalSaving, setModalSaving] = useState(false)

  const selectedGroup = permGroups.find((g) => g.role_id === selectedId)
  const selectedRole = roles.find((r) => r.id === selectedId)
  const isSuperAdmin = selectedId === 1

  // ── Loaders ──
  const loadRoles = () => {
    setLoading(true)
    api.get('/roles/list')
      .then((r) => {
        const items: RoleItem[] = r.data.data ?? []
        setRoles(items)
        if (!selectedId && items.length > 0) {
          setSelectedId(items[0].id)
          setSelectedScope(items[0].scope)
        }
      })
      .catch(() => toast.error('Failed to load roles'))
      .finally(() => setLoading(false))
  }

  const loadPermissions = () => {
    setPermLoading(true)
    api.get('/roles/permissions')
      .then((r) => setPermGroups(r.data.data ?? []))
      .catch(() => toast.error('Failed to load permissions'))
      .finally(() => setPermLoading(false))
  }

  useEffect(() => { loadRoles(); loadPermissions() }, [])

  // ── Permissions ──
  const togglePerm = (field: 'can_read' | 'can_create' | 'can_update' | 'can_delete', permIdx: number) => {
    if (!selectedId || isSuperAdmin) return
    setPermGroups((prev) => prev.map((g) => {
      if (g.role_id !== selectedId) return g
      const ps = [...g.permissions]
      ps[permIdx] = { ...ps[permIdx], [field]: !ps[permIdx][field] }
      return { ...g, permissions: ps }
    }))
  }

  const handleToggle = (field: 'can_read' | 'can_create' | 'can_update' | 'can_delete', pi: number) => {
    if (isSuperAdmin || !perms.canUpdate) return
    if (!selectedGroup && selectedId) {
      setPermGroups((prev) => [...prev, {
        role_id: selectedId,
        role_name: selectedRole?.name ?? '',
        permissions: getDefaultPerms(),
      }])
    }
    togglePerm(field, pi)
  }

  const savePermissions = async () => {
    if (isSuperAdmin || !selectedId) return
    const group = permGroups.find((g) => g.role_id === selectedId)
    const permsToSave = group?.permissions ?? getDefaultPerms()
    setPermSaving(true)
    try {
      await api.put('/roles/permissions/bulk', {
        role_id: selectedId,
        permissions: permsToSave.map((p) => ({
          resource: p.resource, can_read: p.can_read,
          can_create: p.can_create, can_update: p.can_update, can_delete: p.can_delete,
        })),
      })
      toast.success('Permissions saved')
      loadPermissions()
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setPermSaving(false) }
  }

  // ── Scope ──
  const handleScopeChange = async (scope: string) => {
    if (!selectedId || !selectedRole || selectedRole.read_only || scope === selectedScope) return
    setScopeSaving(true)
    try {
      await api.put(`/roles/${selectedId}/scope`, { scope })
      toast.success(`Scope updated to "${scope}"`)
      setSelectedScope(scope)
      // Update in roles list so card subtitle reflects immediately
      setRoles((prev) => prev.map((r) => r.id === selectedId ? { ...r, scope } : r))
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setScopeSaving(false) }
  }

  // ── Role CRUD ──
  const handleCreateRole = async () => {
    if (!roleName.trim()) { toast.error('Role name required'); return }
    setModalSaving(true)
    try {
      await api.post('/roles/create', { name: roleName.trim() })
      toast.success('Role created'); setModal(null); setRoleName('')
      loadRoles(); loadPermissions()
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setModalSaving(false) }
  }

  const handleUpdateRole = async () => {
    if (!editRole || !roleName.trim()) { toast.error('Role name required'); return }
    setModalSaving(true)
    try {
      await api.put(`/roles/${editRole.id}`, { name: roleName.trim() })
      toast.success('Role updated'); setModal(null); setEditRole(null); setRoleName('')
      loadRoles(); loadPermissions()
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setModalSaving(false) }
  }

  const handleDeleteRole = async (role: RoleItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete role "${role.name}"?`)) return
    try {
      await api.delete(`/roles/${role.id}`)
      toast.success('Role deleted')
      if (selectedId === role.id) { setSelectedId(roles[0]?.id ?? null); setSelectedScope(roles[0]?.scope ?? 'all') }
      loadRoles(); loadPermissions()
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
  }

  // ── Small components ──
  const Label = ({ children }: { children: string }) => (
    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4, marginBottom: 4, display: 'block' }}>{children}</label>
  )

  const CheckBox = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <div onClick={disabled ? undefined : onChange}
      style={{
        width: 20, height: 20, borderRadius: 5, margin: '0 auto', cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
        backgroundColor: checked ? 'var(--brand-600)' : 'transparent',
        border: `2px solid ${checked ? 'var(--brand-600)' : '#888'}`,
        opacity: disabled ? 0.4 : 1,
      }}>
      {checked && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
    </div>
  )

  const activePerms: PermItem[] = ALL_RESOURCES.map(resource => {
  const found = selectedGroup?.permissions.find(p => p.resource === resource)
  if (found) return found
  return {
    id: 0, resource,
    can_read:   isSuperAdmin,
    can_create: isSuperAdmin,
    can_update: isSuperAdmin,
    can_delete: isSuperAdmin,
  }
})

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))' }}>
            <Shield style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Roles & Permissions</h1>
            <p style={{ fontSize: 11, opacity: 0.4 }}>{roles.length} role{roles.length !== 1 ? 's' : ''} configured</p>
          </div>
        </div>
        {perms.canCreate && (
          <button onClick={() => { setModal('create'); setRoleName('') }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Plus style={{ width: 14, height: 14 }} /> New Role
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>

        {/* ── Left: Role Cards ── */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.3, marginBottom: 4, paddingLeft: 4 }}>Roles</div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 30 }}>
              <div style={{ width: 20, height: 20, border: '2px solid var(--brand-600)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
          ) : roles.map((r) => (
            <div key={r.id}
              onClick={() => { setSelectedId(r.id); setSelectedScope(r.scope) }}
              style={{
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                backgroundColor: selectedId === r.id ? 'color-mix(in srgb, var(--brand-600) 15%, transparent)' : 'var(--bg-input)',
                border: `1.5px solid ${selectedId === r.id ? 'color-mix(in srgb, var(--brand-600) 50%, transparent)' : 'var(--border-color)'}`,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
                    backgroundColor: ROLE_COLORS[r.id] || 'var(--brand-600)',
                  }}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 10, opacity: 0.35 }}>
                      {r.read_only ? 'System' : 'Custom'} · {r.scope}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {!r.read_only && perms.canUpdate && (
                    <div onClick={(e) => { e.stopPropagation(); setModal('edit'); setEditRole(r); setRoleName(r.name) }}
                      style={{ width: 24, height: 24, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0.3, transition: 'opacity 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}>
                      <Edit2 style={{ width: 12, height: 12 }} />
                    </div>
                  )}
                  {!r.read_only && perms.canDelete && (
                    <div onClick={(e) => handleDeleteRole(r, e)}
                      style={{ width: 24, height: 24, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0.3, transition: 'opacity 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}>
                      <Trash2 style={{ width: 12, height: 12, color: '#ef4444' }} />
                    </div>
                  )}
                  {r.read_only && <Lock style={{ width: 12, height: 12, opacity: 0.15 }} />}
                </div>
              </div>
            </div>
          ))}

          {perms.canCreate && (
            <div onClick={() => { setModal('create'); setRoleName('') }}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px dashed var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, opacity: 0.3, transition: 'opacity 0.15s', marginTop: 4 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}>
              <Plus style={{ width: 14, height: 14 }} /> Add Role
            </div>
          )}
        </div>

        {/* ── Right: Permissions + Scope ── */}
        <div style={{ flex: 1 }}>
          {!selectedRole && !loading ? (
            <div className="card" style={{ padding: 60, textAlign: 'center', opacity: 0.3 }}>
              <Shield style={{ width: 40, height: 40, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>Select a role</p>
              <p style={{ fontSize: 12 }}>Click a role on the left to manage its permissions</p>
            </div>
          ) : selectedRole && (
            <>
              {/* Permissions header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedRole.name} Permissions</div>
                  <div style={{ fontSize: 11, opacity: 0.35 }}>
                    {isSuperAdmin ? 'Full access — cannot be modified' : 'Configure resource access for this role'}
                  </div>
                </div>
                {perms.canUpdate && !isSuperAdmin && (
                  <button onClick={savePermissions} disabled={permSaving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <Save style={{ width: 14, height: 14 }} /> {permSaving ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>

              {isSuperAdmin && (
                <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock style={{ width: 14, height: 14, color: '#f59e0b', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>SuperAdmin has full access — permissions are locked</span>
                </div>
              )}

              {!isSuperAdmin && !selectedGroup && (
                <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>⚠ No permissions saved yet — configure below and click Save</span>
                </div>
              )}

              {/* Permissions table */}
              {permLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ width: 24, height: 24, border: '3px solid var(--brand-600)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                </div>
              ) : (
                <div className="card" style={{ overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '2px solid var(--brand-700)', backgroundColor: 'var(--bg-input)' }}>Resource</th>
                        {['Read', 'Create', 'Update', 'Delete'].map((h) => (
                          <th key={h} style={{ textAlign: 'center', padding: '12px 14px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '2px solid var(--brand-700)', backgroundColor: 'var(--bg-input)', width: 90 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activePerms.map((p, pi) => (
                        <tr key={p.resource}>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', fontSize: 13, fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, backgroundColor: p.can_read ? '#10b981' : 'var(--border-color)' }} />
                              <span style={{ textTransform: 'capitalize' }}>{p.resource.replace(/_/g, ' ')}</span>
                            </div>
                          </td>
                          {(['can_read', 'can_create', 'can_update', 'can_delete'] as const).map((field) => (
                            <td key={field} style={{ textAlign: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
                              <CheckBox checked={p[field]} onChange={() => handleToggle(field, pi)} disabled={isSuperAdmin || !perms.canUpdate} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Scope Selector ── */}
              <div className="card" style={{ padding: 20, marginTop: 20 }}>
                { <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Company Access Scope</div>
                    <div style={{ fontSize: 11, opacity: 0.35 }}>
                      {selectedRole.read_only ? 'System role — scope is fixed' : 'Which companies can users with this role access?'}
                    </div>
                  </div>
                  {selectedRole.read_only && <Lock style={{ width: 14, height: 14, opacity: 0.3 }} />}
                </div> }

                { <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {SCOPE_OPTIONS.map((opt) => {
                    const isActive = selectedScope === opt.value
                    const isLocked = selectedRole.read_only || !perms.canUpdate
                    const Icon = opt.icon
                    return (
                      <div key={opt.value}
                        onClick={() => !isLocked && !scopeSaving && handleScopeChange(opt.value)}
                        style={{
                          padding: '14px 16px', borderRadius: 10,
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s', opacity: isLocked ? 0.5 : 1,
                          backgroundColor: isActive ? `color-mix(in srgb, ${opt.color} 12%, transparent)` : 'var(--bg-input)',
                          border: `1.5px solid ${isActive ? opt.color : 'var(--border-color)'}`,
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <Icon style={{ width: 16, height: 16, color: isActive ? opt.color : undefined, opacity: isActive ? 1 : 0.4 }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? opt.color : undefined }}>{opt.label}</span>
                        </div>
                        <p style={{ fontSize: 11, opacity: 0.45, lineHeight: 1.4, margin: 0 }}>{opt.desc}</p>
                      </div>
                    )
                  })}
                </div> }

                {/* {selectedScope === 'assigned' && !selectedRole.read_only && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#f59e0b' }}>
                    ⚡ Go to the <strong>User Detail</strong> page to assign specific companies to each user with this role.
                  </div>
                )} */}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══ Create/Edit Modal ══ */}
      {modal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setModal(null)}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{modal === 'create' ? 'New Role' : 'Edit Role'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, fontSize: 18 }}>✕</button>
            </div>
            <div>
              <Label>Role Name</Label>
              <input className="input" value={roleName} onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Manager, Viewer, Operator" autoFocus
                onKeyDown={(e) => e.key === 'Enter' && (modal === 'create' ? handleCreateRole() : handleUpdateRole())}
                style={{ fontSize: 14 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <button onClick={() => setModal(null)} className="btn-secondary" style={{ fontSize: 13 }}>Cancel</button>
              <button onClick={modal === 'create' ? handleCreateRole : handleUpdateRole}
                disabled={modalSaving || !roleName.trim()} className="btn-primary"
                style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                {modal === 'create' ? <><Plus style={{ width: 14, height: 14 }} /> Create</> : <><Save style={{ width: 14, height: 14 }} /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
