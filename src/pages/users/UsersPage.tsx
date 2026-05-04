import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api/client'
import {
  Users as UsersIcon, Plus, ChevronLeft, Save, Search,
  RefreshCw, Key, Trash2, Building2, Check, X as XIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { PagePermissions } from '@/components/layout/withPermissions'
import { Pagination } from '@/components/ui/Pagination'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserItem {
  id: number; name: string; username: string; email: string; phone: string
  role: number; role_id: number; tenant_id: number; tenant_name: string
  language: string; active: boolean; quota: number
  mfa_enabled: boolean; created_at: string
}
interface RoleOption    { id: number; name: string; scope: string }
interface LangOption    { value: string; label: string }
interface CompanyOption { id: number; firm_name: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const MAIN_TENANT_ID = 1

const B = '1px solid var(--border-color)'
const ROLE_BADGE: Record<number, { bg: string; color: string }> = {
  1: { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
  2: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  3: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
  4: { bg: 'color-mix(in srgb, var(--brand-600) 15%, transparent)', color: 'var(--brand-500)' },
}
const EMPTY_FORM = {
  name: '', username: '', email: '', phone: '', password: '',
  role_id: 2, language: 'en', quota: 0, tenant_id: MAIN_TENANT_ID,
}
const EMPTY_EDIT = {
  name: '', email: '', phone: '', role_id: 2,
  language: 'en', active: true, quota: 0, tenant_id: MAIN_TENANT_ID,
}

const Label = ({ children }: { children: string }) => (
  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4, marginBottom: 4, display: 'block' }}>{children}</label>
)
const Spinner = () => (
  <div style={{ width: 24, height: 24, border: '3px solid var(--brand-600)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
)

// ─── Company Multi-select ─────────────────────────────────────────────────────
function CompanyAssignment({ companies, selected, onChange, disabled, label }: {
  companies: CompanyOption[]; selected: number[]; onChange: (ids: number[]) => void
  disabled?: boolean; label?: string
}) {
  const toggle = (id: number) => {
    if (disabled) return
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }
  return (
    <div>
      <Label>{label ?? 'Assigned Companies'}</Label>
      {companies.length === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.4, padding: '8px 0' }}>No companies available</div>
      ) : (
        <div style={{ maxHeight: 200, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
          {companies.map((c, i) => {
            const checked = selected.includes(c.id)
            return (
              <div key={c.id} onClick={() => toggle(c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: disabled ? 'default' : 'pointer', borderBottom: i < companies.length - 1 ? B : 'none', backgroundColor: checked ? 'color-mix(in srgb, var(--brand-600) 8%, transparent)' : 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!disabled && !checked) e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!disabled && !checked) e.currentTarget.style.backgroundColor = 'transparent' }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${checked ? 'var(--brand-500)' : 'var(--border-color)'}`, backgroundColor: checked ? 'var(--brand-500)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' }}>
                  {checked && <Check style={{ width: 10, height: 10, color: '#fff' }} />}
                </div>
                <span style={{ fontSize: 13 }}>{c.firm_name}</span>
              </div>
            )
          })}
        </div>
      )}
      {selected.length > 0 && (
        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
          {selected.length} compan{selected.length !== 1 ? 'ies' : 'y'} selected
        </div>
      )}
    </div>
  )
}

function getTenantBehavior(scope: string) {
  if (scope === 'all')      return 'main'
  if (scope === 'own')      return 'single'
  if (scope === 'assigned') return 'multi'
  return 'single'
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function UsersPage({ perms }: { perms: PagePermissions }) {
  const { user: me } = useAuthStore()
  const myRoleId: number = (me as any)?.role_id ?? (me as any)?.role ?? 2

  const [view, setView]           = useState<'list' | 'new' | 'detail'>('list')
  const [roles, setRoles]         = useState<RoleOption[]>([])
  const [languages, setLanguages] = useState<LangOption[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])

  // List
  const [users, setUsers]           = useState<UserItem[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [pageSize, setPageSize]     = useState(10)
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [loading, setLoading]       = useState(false)
  const totalPages = Math.ceil(total / pageSize)

  // Sort
  const [sortBy,   setSortBy]   = useState<string>('')
  const [sortDesc, setSortDesc] = useState(true)

  const handleSort = (col: string) => {
    const newDesc = sortBy === col ? !sortDesc : true
    setSortBy(col); setSortDesc(newDesc); setPage(1)
  }

  const hasFilters = !!(search || roleFilter !== 'all')

  // Create
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [creating, setCreating]         = useState(false)
  const [formAssigned, setFormAssigned] = useState<number[]>([])

  // Detail
  const [detail, setDetail]               = useState<UserItem | null>(null)
  const [editForm, setEditForm]           = useState(EMPTY_EDIT)
  const [saving, setSaving]               = useState(false)
  const [newPassword, setNewPassword]     = useState('')
  const [resettingPw, setResettingPw]     = useState(false)
  const [editAssigned, setEditAssigned]   = useState<number[]>([])
  const [savingAssigned, setSavingAssigned] = useState(false)

  const roleMap        = Object.fromEntries(roles.map(r => [r.id, r]))
  const scopeOf        = (rid: number) => roleMap[rid]?.scope ?? 'own'
  const tenantBehavior = (rid: number) => getTenantBehavior(scopeOf(rid))

  const creatableRoles = roles.filter(r => {
    if (r.id === 1) return false
    if (myRoleId === 1) return true
    if (myRoleId === 2) return r.id !== 1
    return false
  })

  useEffect(() => { loadRoles(); loadLanguages(); loadCompanies() }, [])
  useEffect(() => { loadUsers() }, [page, pageSize, roleFilter, sortBy, sortDesc])

  const loadRoles = () => {
    api.get('/roles/list').then(res => {
      const all: RoleOption[] = res.data.data ?? []
      // Users page = management roles only (exclude CompanyAdmin=3, CompanyUser=4)
      const mgmtRoles = all.filter(r => r.id !== 3 && r.id !== 4)
      setRoles(mgmtRoles)
      const first = mgmtRoles.find(r => myRoleId === 1 ? r.id !== 1 : r.id >= 2)
      if (first) setForm(f => ({ ...f, role_id: first.id }))
    }).catch(() => {})
  }

  const loadLanguages = () => {
    api.get('/settings/languages')
      .then(res => setLanguages(res.data.data ?? []))
      .catch(() => setLanguages([
        { value: 'en', label: 'English' },
        { value: 'tr', label: 'Turkish' },
        { value: 'ar', label: 'Arabic' },
      ]))
  }

  const loadCompanies = () => {
    api.post('/tenants/list', { page: 1, page_size: 500, search: '' })
      .then(res => setCompanies((res.data.data?.items ?? []).filter((c: any) => c.id !== 1)))
      .catch(() => {})
  }

  const loadUsers = () => {
    setLoading(true)
    api.post('/users/list', {
      page, page_size: pageSize,
      search:    search     || undefined,
      role_id:   roleFilter !== 'all' ? parseInt(roleFilter) : undefined,
      sort_by:   sortBy     || undefined,
      sort_desc: sortDesc,
    })
      .then(res => { setUsers(res.data.data?.items ?? []); setTotal(res.data.data?.total ?? 0) })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }

  const doSearch  = () => { setPage(1); loadUsers() }
  const clearAll  = () => { setSearch(''); setRoleFilter('all'); setSortBy(''); setSortDesc(true); setPage(1) }

  const loadAssignments = async (userId: number) => {
    try {
      const res = await api.get(`/users/${userId}/assignments`)
      setEditAssigned((res.data.data ?? []).map((a: any) => a.tenant_id ?? a.id))
    } catch { setEditAssigned([]) }
  }

  const openDetail = async (u: UserItem) => {
    setDetail(u)
    setEditForm({ name: u.name, email: u.email, phone: u.phone || '', role_id: u.role_id ?? u.role, language: u.language || 'en', active: u.active, quota: u.quota ?? 0, tenant_id: u.tenant_id ?? MAIN_TENANT_ID })
    setNewPassword(''); setEditAssigned([])
    if (scopeOf(u.role_id ?? u.role) === 'assigned') await loadAssignments(u.id)
    setView('detail')
  }

  const handleCreate = async () => {
    if (!form.name || !form.username || !form.email || !form.password) { toast.error('Name, username, email and password required'); return }
    const beh = tenantBehavior(form.role_id)
    if (beh === 'single' && !form.tenant_id) { toast.error('Please select a company'); return }
    if (beh === 'multi' && formAssigned.length === 0) { toast.error('Please assign at least one company'); return }
    setCreating(true)
    try {
      const res = await api.post('/users/create', { name: form.name, username: form.username, email: form.email, phone: form.phone, password: form.password, language: form.language, quota: form.quota, role: form.role_id, tenant_id: beh === 'main' || beh === 'multi' ? MAIN_TENANT_ID : form.tenant_id })
      const newUserId = res.data.data?.id
      if (beh === 'multi' && newUserId) await api.put(`/users/${newUserId}/assignments`, { tenant_ids: formAssigned })
      toast.success('User created')
      setView('list'); setForm(EMPTY_FORM); setFormAssigned([]); setPage(1); loadUsers()
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed to create user') }
    finally { setCreating(false) }
  }

  const handleSave = async () => {
    if (!detail) return
    setSaving(true)
    try {
      const beh = tenantBehavior(editForm.role_id)
      await api.put(`/users/${detail.id}`, { name: editForm.name, email: editForm.email, phone: editForm.phone, role: editForm.role_id, language: editForm.language, quota: editForm.quota, active: editForm.active, tenant_id: beh === 'main' ? MAIN_TENANT_ID : editForm.tenant_id })
      toast.success('User updated')
      loadUsers(); setView('list'); setDetail(null)
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setSaving(false) }
  }

  const handleSaveAssignments = async () => {
    if (!detail) return
    setSavingAssigned(true)
    try { await api.put(`/users/${detail.id}/assignments`, { tenant_ids: editAssigned }); toast.success('Assignments saved') }
    catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setSavingAssigned(false) }
  }

  const handleResetPassword = async () => {
    if (!detail || !newPassword) return
    setResettingPw(true)
    try { await api.post(`/users/${detail.id}/reset-password`, { password: newPassword }); toast.success('Password reset'); setNewPassword('') }
    catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setResettingPw(false) }
  }

  const handleToggleActive = async (id: number) => {
    try {
      await api.post(`/users/${id}/toggle-active`)
      toast.success('Status updated')
      setUsers(us => us.map(u => u.id === id ? { ...u, active: !u.active } : u))
      if (detail?.id === id) { setDetail(d => d ? { ...d, active: !d.active } : d); setEditForm(f => ({ ...f, active: !f.active })) }
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
  }

  const handleDelete = async () => {
    if (!detail || !confirm(`Delete user "${detail.name}"? This cannot be undone.`)) return
    try { await api.delete(`/users/${detail.id}`); toast.success('User deleted'); setView('list'); setDetail(null); loadUsers() }
    catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
  }

  const ScopePill = ({ scope }: { scope: string }) => {
    const map: Record<string, { label: string; color: string }> = {
      all:      { label: 'All companies',      color: '#f59e0b' },
      own:      { label: 'Own company',        color: 'var(--brand-500)' },
      assigned: { label: 'Assigned companies', color: '#8b5cf6' },
    }
    const s = map[scope] ?? { label: scope, color: 'inherit' }
    return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, backgroundColor: `${s.color}22`, color: s.color }}>{s.label}</span>
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NEW USER
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'new') {
    const beh   = tenantBehavior(form.role_id)
    const scope = scopeOf(form.role_id)
    return (
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div onClick={() => setView('list')} style={{ cursor: 'pointer', padding: 8, opacity: 0.5 }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}>
            <ChevronLeft style={{ width: 20, height: 20 }} />
          </div>
          <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>New User</h1><p style={{ fontSize: 12, opacity: 0.4 }}>Management portal user</p></div>
        </div>
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <Label>Role *</Label>
              <select className="input" value={form.role_id} onChange={e => { const rid = parseInt(e.target.value); const b = getTenantBehavior(scopeOf(rid)); setForm(f => ({ ...f, role_id: rid, tenant_id: b === 'single' ? 0 : MAIN_TENANT_ID })); setFormAssigned([]) }}>
                {creatableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Language</Label>
              <select className="input" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--bg-input)', fontSize: 12 }}>
            <Building2 style={{ width: 14, height: 14, opacity: 0.4 }} />
            <span style={{ opacity: 0.55 }}>Company access:</span>
            <ScopePill scope={scope} />
            {beh === 'main' && <span style={{ opacity: 0.4, fontSize: 11 }}>— assigned to the system tenant</span>}
          </div>
          {beh === 'single' && (
            <div>
              <Label>Company *</Label>
              <select className="input" value={form.tenant_id || ''} onChange={e => setForm({ ...form, tenant_id: parseInt(e.target.value) })}>
                <option value="">— Select company —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.firm_name}</option>)}
              </select>
            </div>
          )}
          {beh === 'multi' && <CompanyAssignment companies={companies} selected={formAssigned} onChange={setFormAssigned} label="Assigned Companies *" />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><Label>Full Name *</Label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
            <div><Label>Username *</Label><input className="input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="janedoe" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><Label>Email *</Label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" /></div>
            <div><Label>Phone</Label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+971..." /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><Label>Password *</Label><input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" /></div>
            <div><Label>SMS Quota (0 = unlimited)</Label><input className="input" type="number" value={form.quota} onChange={e => setForm({ ...form, quota: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={handleCreate} disabled={creating} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus style={{ width: 14, height: 14 }} /> {creating ? 'Creating...' : 'Create User'}
            </button>
            <button onClick={() => setView('list')} className="btn-secondary">Cancel</button>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'detail' && detail) {
    const editBeh        = tenantBehavior(editForm.role_id)
    const editScope      = scopeOf(editForm.role_id)
    const isEditingSuper = detail.role === 1 || detail.role_id === 1
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div onClick={() => { setView('list'); setDetail(null) }} style={{ cursor: 'pointer', padding: 8, opacity: 0.5 }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}>
              <ChevronLeft style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>{detail.name}</h1>
              <p style={{ fontSize: 12, opacity: 0.4 }}>@{detail.username} · {detail.email}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: detail.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: detail.active ? '#10b981' : '#ef4444' }}>
              {detail.active ? 'Active' : 'Inactive'}
            </span>
            {perms.canUpdate && !isEditingSuper && (
              <button onClick={() => handleToggleActive(detail.id)} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
                {detail.active ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.3, marginBottom: 16 }}>User Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Label>Role</Label>
                <select className="input" value={editForm.role_id} disabled={!perms.canUpdate || isEditingSuper}
                  onChange={e => { const rid = parseInt(e.target.value); const b = getTenantBehavior(scopeOf(rid)); setEditForm(f => ({ ...f, role_id: rid, tenant_id: b === 'main' ? MAIN_TENANT_ID : f.tenant_id })); setEditAssigned([]); if (scopeOf(rid) === 'assigned') loadAssignments(detail.id) }}>
                  {isEditingSuper ? <option value={1}>{roleMap[1]?.name ?? 'SuperAdmin'}</option> : creatableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                {isEditingSuper && <div style={{ fontSize: 10, opacity: 0.4, marginTop: 3 }}>Role is locked for SuperAdmin</div>}
              </div>
              <div>
                <Label>Language</Label>
                <select className="input" value={editForm.language} disabled={!perms.canUpdate} onChange={e => setEditForm({ ...editForm, language: e.target.value })}>
                  {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><Label>Full Name</Label><input className="input" value={editForm.name} disabled={!perms.canUpdate} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div><Label>Phone</Label><input className="input" value={editForm.phone} disabled={!perms.canUpdate} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><Label>Email</Label><input className="input" value={editForm.email} disabled={!perms.canUpdate} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div><Label>SMS Quota</Label><input className="input" type="number" value={editForm.quota} disabled={!perms.canUpdate} onChange={e => setEditForm({ ...editForm, quota: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--bg-input)', fontSize: 12 }}>
              <Building2 style={{ width: 14, height: 14, opacity: 0.4 }} />
              <span style={{ opacity: 0.55 }}>Company access:</span>
              <ScopePill scope={editScope} />
            </div>
            {editBeh === 'single' && (
              <div>
                <Label>Company</Label>
                <select className="input" value={editForm.tenant_id || ''} disabled={!perms.canUpdate} onChange={e => setEditForm({ ...editForm, tenant_id: parseInt(e.target.value) })}>
                  <option value="">— Select company —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.firm_name}</option>)}
                </select>
              </div>
            )}
            {editBeh === 'main' && (
              <div><Label>Company</Label><input className="input" value="KKTC SMS (System)" disabled style={{ opacity: 0.5 }} /></div>
            )}
          </div>
          {perms.canUpdate && (
            <div style={{ marginTop: 16 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Save style={{ width: 14, height: 14 }} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {editBeh === 'multi' && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.3, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building2 style={{ width: 12, height: 12 }} /> Company Assignments
            </div>
            <CompanyAssignment companies={companies} selected={editAssigned} onChange={setEditAssigned} disabled={!perms.canUpdate} />
            {perms.canUpdate && (
              <div style={{ marginTop: 12 }}>
                <button onClick={handleSaveAssignments} disabled={savingAssigned} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <Save style={{ width: 14, height: 14 }} /> {savingAssigned ? 'Saving...' : 'Save Assignments'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="card" style={{ padding: '4px 20px', marginBottom: 16 }}>
          {[
            { label: 'ID',       value: String(detail.id) },
            { label: 'Username', value: `@${detail.username}` },
            { label: 'Company',  value: detail.tenant_name || '—' },
            { label: 'MFA',      value: detail.mfa_enabled ? 'Enabled' : 'Off' },
            { label: 'Status',   value: detail.active ? 'Active' : 'Inactive' },
            { label: 'Created',  value: new Date(detail.created_at).toLocaleDateString() },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? B : 'none', fontSize: 12 }}>
              <span style={{ opacity: 0.5 }}>{row.label}</span>
              <span style={{ fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {perms.canUpdate && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.3, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Key style={{ width: 12, height: 12 }} /> Reset Password
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <input className="input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" style={{ maxWidth: 300 }} />
              <button onClick={handleResetPassword} disabled={resettingPw || !newPassword} className="btn-secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                {resettingPw ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </div>
        )}

        {perms.canDelete && !isEditingSuper && (
          <div className="card" style={{ padding: 20, borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>Delete User</div>
                <div style={{ fontSize: 11, opacity: 0.4, marginTop: 2 }}>This will permanently remove the account</div>
              </div>
              <button onClick={handleDelete} className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <Trash2 style={{ width: 14, height: 14 }} /> Delete
              </button>
            </div>
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))' }}>
            <UsersIcon style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Users</h1>
            <p style={{ fontSize: 11, opacity: 0.4 }}>{total} user{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {perms.canCreate && (
          <button onClick={() => setView('new')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Plus style={{ width: 15, height: 15 }} /> New User
          </button>
        )}
      </div>

      {/* ── Filter bar — single row ── */}
      <div className="card" style={{ padding: '8px 12px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

          <select value={roleFilter} className="input"
            onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
            style={{ height: 32, fontSize: 12, width: 140, flexShrink: 0 }}>
            <option value="all">All Roles</option>
            {roles.map(r => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
          </select>

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Search style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, opacity: 0.4, pointerEvents: 'none' }} />
            <input type="text" placeholder="Search name, email..." value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              className="input" style={{ paddingLeft: 28, width: 200, height: 32, fontSize: 12 }} />
          </div>

          {hasFilters && (
            <button onClick={clearAll}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '0 9px', height: 32, borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <XIcon style={{ width: 10, height: 10 }} /> Clear
            </button>
          )}

          <button onClick={doSearch} className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, height: 32, padding: '0 11px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Search style={{ width: 11, height: 11 }} /> Search
          </button>

          <button onClick={() => { clearAll(); loadUsers() }} className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', padding: '0 8px', height: 32, flexShrink: 0 }}>
            <RefreshCw style={{ width: 11, height: 11 }} />
          </button>

        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              {[
                { label: 'User',    col: 'name'    },
                { label: 'Email',   col: 'email'   },
                { label: 'Company', col: 'company' },
                { label: 'Role',    col: 'role'    },
                { label: 'Access',  col: ''        },
                { label: 'Status',  col: 'active'  },
                { label: 'Created', col: 'created' },
              ].map(({ label, col }) => {
                const isActive = col && sortBy === col
                return (
                  <th key={label} onClick={() => col && handleSort(col)}
                    style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '2px solid var(--brand-700)', backgroundColor: 'var(--bg-input)', whiteSpace: 'nowrap', cursor: col ? 'pointer' : 'default', userSelect: 'none', color: isActive ? 'var(--brand-400)' : 'inherit' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {label}
                      {col && <span style={{ opacity: isActive ? 1 : 0.25, fontSize: 10 }}>{isActive ? (sortDesc ? '↓' : '↑') : '↕'}</span>}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, borderBottom: B }}><Spinner /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 13, borderBottom: B }}>No users found</td></tr>
            ) : users.map(u => {
              const roleInfo = roleMap[u.role_id ?? u.role]
              const badge    = ROLE_BADGE[u.role_id ?? u.role] ?? ROLE_BADGE[4]
              return (
                <tr key={u.id} onClick={() => openDetail(u)} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px 14px', borderBottom: B }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, var(--brand-400), var(--brand-600))', flexShrink: 0 }}>
                        {u.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 10, opacity: 0.4 }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: B, fontSize: 12, opacity: 0.6 }}>{u.email}</td>
                  <td style={{ padding: '12px 14px', borderBottom: B, fontSize: 12, opacity: 0.55 }}>{u.tenant_name || <span style={{ opacity: 0.3 }}>—</span>}</td>
                  <td style={{ padding: '12px 14px', borderBottom: B }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: badge.bg, color: badge.color }}>
                      {roleInfo?.name ?? `Role ${u.role_id ?? u.role}`}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: B }}>
                    {roleInfo && <ScopePill scope={roleInfo.scope} />}
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: B }}>
                    <span onClick={e => { e.stopPropagation(); perms.canUpdate && handleToggleActive(u.id) }}
                      style={{ cursor: perms.canUpdate ? 'pointer' : 'default', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: u.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: u.active ? '#10b981' : '#ef4444' }}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: B, fontSize: 11, opacity: 0.4, whiteSpace: 'nowrap' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} total={total} pageSize={pageSize} onPageChange={p => setPage(p)} onPageSizeChange={s => { setPageSize(s); setPage(1) }} />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
