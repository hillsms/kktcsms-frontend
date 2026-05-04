import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api/client'
import {
  Users as UsersIcon, Plus, ChevronLeft, Save, Search, RefreshCw, Key, Trash2, Star,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { PagePermissions } from '@/components/layout/withPermissions'
import { Pagination } from '@/components/ui/Pagination'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserItem {
  id: number; tenant_id: number; tenant_name: string
  name: string; username: string; email: string; phone: string
  role: number; language: string; active: boolean
  quota: number; mfa_enabled: boolean; created_at: string
}
interface RoleOption    { id: number; name: string; scope: string }
interface LangOption    { value: string; label: string }
interface CompanyOption { id: number; firm_name: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const B = '1px solid var(--border-color)'
const ROLE_BADGE: Record<number, { bg: string; color: string }> = {
  1: { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
  2: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  3: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
  4: { bg: 'color-mix(in srgb, var(--brand-600) 15%, transparent)', color: 'var(--brand-500)' },
}
const EMPTY_FORM = { name: '', username: '', email: '', phone: '', password: '', role: 0, language: '', quota: 0 }
const EMPTY_EDIT = { name: '', email: '', phone: '', role: 0, language: '', active: true, quota: 0 }

const Label = ({ children }: { children: string }) => (
  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4, marginBottom: 4, display: 'block' }}>{children}</label>
)
const Spinner = () => (
  <div style={{ width: 24, height: 24, border: '3px solid var(--brand-600)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
)

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CompanyUsersPage({ perms }: { perms: PagePermissions }) {
  const { user: me } = useAuthStore()
  const myRoleId: number   = (me as any)?.role_id ?? (me as any)?.role ?? 4
  const myTenantId: number = (me as any)?.tenant_id ?? 0
  const myScope: string    = (me as any)?.role_scope ?? 'own'

  // Scope-based flags — NOT role-id-based
  // own      → CompanyAdmin / CompanyUser — no dropdown, auto-select their company
  // assigned → Custom role with assigned companies — show dropdown of assigned companies
  // all      → Admin / SuperAdmin — show dropdown of all companies
  const isOwnScope        = myScope === 'own'     // pure company-level user
  const showCompanyDropdown = !isOwnScope          // show for assigned + all scopes

  const canEditTarget = (targetRole: number): boolean => {
    if (!perms.canUpdate) return false
    if (myRoleId <= 2)           return true
    if (targetRole <= 2)         return false
    if (myRoleId < targetRole)   return true
    if (myRoleId === targetRole) return false
    return false
  }

  const isLimitedEdit = isOwnScope && myRoleId >= 4  // CompanyUser own-scope only

  // ── State ─────────────────────────────────────────────────────────────────
  const [view, setView]             = useState<'list' | 'new' | 'detail'>('list')
  const [roles, setRoles]           = useState<RoleOption[]>([])
  const [languages, setLanguages]   = useState<LangOption[]>([])
  const roleMap = Object.fromEntries(roles.map(r => [r.id, r.name]))

  const [companies, setCompanies]             = useState<CompanyOption[]>([])
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null)

  const [users, setUsers]           = useState<UserItem[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [pageSize, setPageSize]     = useState(10)
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [loading, setLoading]       = useState(false)
  const totalPages = Math.ceil(total / pageSize)

  const [sortBy,   setSortBy]   = useState<string>('')
  const [sortDesc, setSortDesc] = useState(true)

  const handleSort = (col: string) => {
    setSortBy(col); setSortDesc(sortBy === col ? !sortDesc : true); setPage(1)
  }

  const [form, setForm]               = useState(EMPTY_FORM)
  const [creating, setCreating]       = useState(false)
  const [detail, setDetail]           = useState<UserItem | null>(null)
  const [editForm, setEditForm]       = useState(EMPTY_EDIT)
  const [saving, setSaving]           = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [resettingPw, setResettingPw] = useState(false)

  // Only show roles with 'own' scope (CompanyAdmin, CompanyUser) — not custom/admin roles
  const companyRoles = roles.filter(r => r.scope === 'own')
  const filterTabs   = [
    { key: 'all', label: 'All Users' },
    ...companyRoles.map(r => ({ key: String(r.id), label: r.name })),
  ]

  // Show company column in table when not own-scope
  const showCompanyCol = showCompanyDropdown
  const colCount = showCompanyCol ? 7 : 6

  // ── Boot ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadRoles()
    loadLanguages()
    if (isOwnScope) {
      // CompanyAdmin/CompanyUser — auto-select their own company, no dropdown
      setSelectedCompany(myTenantId)
    } else if (myScope === 'assigned') {
      // Custom role — load only their assigned companies for dropdown
      api.get(`/users/${(me as any)?.id}/assignments`)
        .then(res => {
          const assigned: { tenant_id: number; firm_name: string }[] = res.data.data ?? []
          setCompanies(assigned.map(a => ({ id: a.tenant_id, firm_name: a.firm_name })))
          if (assigned.length === 1) setSelectedCompany(assigned[0].tenant_id)
          else setSelectedCompany(null)
        })
        .catch(() => toast.error('Failed to load assigned companies'))
    } else {
      // Admin / SuperAdmin — all companies
      api.post('/tenants/list', { page: 1, page_size: 500, search: '' })
        .then(res => setCompanies((res.data.data?.items ?? []).filter((c: any) => c.id !== 1)))
        .catch(() => toast.error('Failed to load companies'))
    }
  }, [])

  useEffect(() => {
    if (isOwnScope && !selectedCompany) return  // wait for own-scope tenant to be set
    loadUsers()
  }, [selectedCompany, page, pageSize, roleFilter, sortBy, sortDesc])

  const loadRoles = () => {
    api.get('/roles/list')
      .then(res => {
        const all: RoleOption[] = res.data.data ?? []
        setRoles(all)
        const first = all.find(r => r.id >= 3 || r.scope === 'own')
        if (first) { setForm(f => ({ ...f, role: first.id })); setEditForm(f => ({ ...f, role: first.id })) }
      })
      .catch(() => {})
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

  const loadUsers = () => {
    setLoading(true)

    // When a specific company is selected, fetch all its users (page_size=500)
    // and paginate client-side — avoids server total mismatch with client filter.
    // When no company selected (admin browsing all), use server-side pagination normally.
    const fetchAll = !!selectedCompany

    api.post('/users/company-users', {
      tenant_id: selectedCompany ?? undefined,
      page:      fetchAll ? 1 : page,
      page_size: fetchAll ? 500 : pageSize,
      search:    search     || undefined,
      role_id:   roleFilter !== 'all' ? parseInt(roleFilter) : undefined,
      sort_by:   sortBy     || undefined,
      sort_desc: sortDesc,
    })
      .then(res => {
        let items: UserItem[] = res.data.data?.items ?? []

        // Safety filter — ensures only the selected company's users are shown
        if (selectedCompany) {
          items = items.filter(u => u.tenant_id === selectedCompany)
        }

        if (fetchAll) {
          // Client-side pagination
          const totalCount = items.length
          const start      = (page - 1) * pageSize
          setUsers(items.slice(start, start + pageSize))
          setTotal(totalCount)
        } else {
          setUsers(items)
          setTotal(res.data.data?.total ?? 0)
        }
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }

  const doSearch = () => { setPage(1); loadUsers() }

  const clearAll = () => {
    setSearch('')
    setRoleFilter('all')
    setSelectedCompany(isOwnScope ? myTenantId : null)
    setSortBy(''); setSortDesc(true)
    setPage(1)
  }

  const onCompanyChange = (id: number | null) => {
    setSelectedCompany(id); setPage(1); setSearch('')
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!perms.canCreate) { toast.error('No permission to create users'); return }
    if (!form.name || !form.username || !form.email || !form.password) {
      toast.error('Name, username, email and password required'); return
    }
    if (!selectedCompany) { toast.error('No company selected'); return }
    setCreating(true)
    try {
      await api.post('/users/create', { ...form, tenant_id: selectedCompany })
      toast.success('User created')
      setView('list'); setForm(EMPTY_FORM); setPage(1); loadUsers()
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed to create user') }
    finally { setCreating(false) }
  }

  const openDetail = (u: UserItem) => {
    setDetail(u)
    setEditForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, language: u.language || 'en', active: u.active, quota: u.quota ?? 0 })
    setNewPassword('')
    setView('detail')
  }

  const handleSave = async () => {
    if (!detail || !canEditTarget(detail.role)) return
    setSaving(true)
    try {
      await api.put(`/users/${detail.id}`, editForm)
      toast.success('User updated')
      loadUsers(); setView('list'); setDetail(null)
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setSaving(false) }
  }

  const handleResetPassword = async () => {
    if (!detail || !newPassword || !canEditTarget(detail.role)) return
    setResettingPw(true)
    try {
      await api.post(`/users/${detail.id}/reset-password`, { password: newPassword })
      toast.success('Password reset'); setNewPassword('')
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setResettingPw(false) }
  }

  const handleToggleActive = async (id: number, targetRole: number) => {
    if (!perms.canUpdate || !canEditTarget(targetRole)) return
    try {
      await api.post(`/users/${id}/toggle-active`)
      toast.success('Status updated')
      setUsers(us => us.map(u => u.id === id ? { ...u, active: !u.active } : u))
      if (detail?.id === id) { setDetail(d => d ? { ...d, active: !d.active } : d); setEditForm(f => ({ ...f, active: !f.active })) }
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
  }

  const handleDelete = async () => {
    if (!detail || !perms.canDelete || !canEditTarget(detail.role)) return
    if (!confirm(`Delete user "${detail.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/users/${detail.id}`)
      toast.success('User deleted'); setView('list'); setDetail(null); loadUsers()
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
  }

  const selectedName = isOwnScope
    ? ((me as any)?.tenant_name ?? '')
    : (companies.find(c => c.id === selectedCompany)?.firm_name ?? '')

  // ══════════════════════════════════════════════════════════════════════════
  // NEW USER VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'new') return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div onClick={() => setView('list')} style={{ cursor: 'pointer', padding: 8, opacity: 0.5 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}>
          <ChevronLeft style={{ width: 20, height: 20 }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>New User</h1>
          <p style={{ fontSize: 12, opacity: 0.4 }}>Creating for: {selectedName}</p>
        </div>
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <Label>Role *</Label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: parseInt(e.target.value) })}>
                {companyRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Language</Label>
              <select className="input" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><Label>Full Name *</Label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" /></div>
            <div><Label>Username *</Label><input className="input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="johndoe" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><Label>Email *</Label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" /></div>
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
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'detail' && detail) {
    const canEdit  = canEditTarget(detail.role)
    const readOnly = !canEdit
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div onClick={() => { setView('list'); setDetail(null) }} style={{ cursor: 'pointer', padding: 8, opacity: 0.5 }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}>
              <ChevronLeft style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>{detail.name}</h1>
              <p style={{ fontSize: 12, opacity: 0.4 }}>@{detail.username} · {detail.email} · {roleMap[detail.role] ?? `Role ${detail.role}`}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {readOnly && !perms.canUpdate && <span style={{ fontSize: 11, opacity: 0.45, fontStyle: 'italic' }}>Read only</span>}
            {readOnly && perms.canUpdate  && <span style={{ fontSize: 11, opacity: 0.45, fontStyle: 'italic' }}>No edit access</span>}
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: detail.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: detail.active ? '#10b981' : '#ef4444' }}>
              {detail.active ? 'Active' : 'Inactive'}
            </span>
            {canEdit && perms.canUpdate && (
              <button onClick={() => handleToggleActive(detail.id, detail.role)} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
                {detail.active ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.3, marginBottom: 16 }}>User Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><Label>Full Name</Label><input className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} disabled={readOnly} /></div>
              <div><Label>Phone</Label><input className="input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} disabled={readOnly} /></div>
            </div>
            {!isLimitedEdit && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><Label>Email</Label><input className="input" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} disabled={readOnly} /></div>
                <div>
                  <Label>Role</Label>
                  <select className="input" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: parseInt(e.target.value) })} disabled={readOnly}>
                    {companyRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <Label>Language</Label>
                <select className="input" value={editForm.language} onChange={e => setEditForm({ ...editForm, language: e.target.value })} disabled={readOnly}>
                  {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div><Label>SMS Quota</Label><input className="input" type="number" value={editForm.quota} onChange={e => setEditForm({ ...editForm, quota: parseInt(e.target.value) || 0 })} disabled={readOnly} /></div>
              <div><Label>Company</Label><input className="input" value={detail.tenant_name || selectedName} disabled style={{ opacity: 0.5 }} /></div>
            </div>
          </div>
          {canEdit && perms.canUpdate && (
            <div style={{ marginTop: 16 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Save style={{ width: 14, height: 14 }} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '4px 20px', marginBottom: 16 }}>
          {[
            { label: 'ID',       value: String(detail.id) },
            { label: 'Username', value: `@${detail.username}` },
            { label: 'Company',  value: detail.tenant_name || selectedName },
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

        {canEdit && perms.canUpdate && (
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

        {canEdit && perms.canDelete && (
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
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Company Users</h1>
            <p style={{ fontSize: 11, opacity: 0.4 }}>
              {selectedName || 'All Companies'}
              {total > 0 && ` · ${total} user${total !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {/* New User — show if canCreate; validate company selection on click */}
        {perms.canCreate && (
          <button onClick={() => {
            if (!selectedCompany) { toast.error('Please select a company first'); return }
            setView('new')
          }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Plus style={{ width: 15, height: 15 }} /> New User
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '8px 12px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {showCompanyDropdown && (
            <select value={selectedCompany ?? ''} className="input"
              onChange={e => onCompanyChange(e.target.value ? parseInt(e.target.value) : null as any)}
              style={{ height: 32, fontSize: 12, minWidth: 200, maxWidth: 320, flexShrink: 0 }}>
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.firm_name}</option>)}
            </select>
          )}
          <select value={roleFilter} className="input"
            onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
            style={{ height: 32, fontSize: 12, width: 130, flexShrink: 0 }}>
            {filterTabs.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Search style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, opacity: 0.4, pointerEvents: 'none' }} />
            <input type="text" placeholder="Search name, email..." value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              className="input" style={{ paddingLeft: 28, width: 200, height: 32, fontSize: 12 }} />
          </div>
          {(search || roleFilter !== 'all') && (
            <button onClick={clearAll}
              style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, padding: '0 9px', height: 32, borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
              Clear
            </button>
          )}
          <button onClick={doSearch} className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, height: 32, padding: '0 11px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Search style={{ width: 11, height: 11 }} /> Search
          </button>
          <button onClick={clearAll} className="btn-secondary"
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
                ...(showCompanyCol ? [{ label: 'Company', col: 'company' }] : []),
                { label: 'Email',   col: 'email'   },
                { label: 'Role',    col: 'role'    },
                { label: 'Quota',   col: 'quota'   },
                { label: 'Status',  col: 'active'  },
                { label: 'Created', col: 'created' },
              ].map(({ label, col }) => {
                const active = sortBy === col
                return (
                  <th key={col} onClick={() => handleSort(col)}
                    style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '2px solid var(--brand-700)', backgroundColor: 'var(--bg-input)', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', color: active ? 'var(--brand-400)' : 'inherit' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {label}
                      <span style={{ opacity: active ? 1 : 0.25, fontSize: 10 }}>{active ? (sortDesc ? '↓' : '↑') : '↕'}</span>
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={colCount} style={{ textAlign: 'center', padding: 40, borderBottom: B }}><Spinner /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={colCount} style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 13, borderBottom: B }}>No users found</td></tr>
            ) : users.map(u => {
              const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE[4]
              return (
                <tr key={u.id} onClick={() => openDetail(u)} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px 14px', borderBottom: B }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', background: u.role <= 3 ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'linear-gradient(135deg, var(--brand-400), var(--brand-600))', flexShrink: 0 }}>
                        {u.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 10, opacity: 0.4 }}>@{u.username}</div>
                      </div>
                      {u.role <= 3 && <Star style={{ width: 12, height: 12, fill: '#f59e0b', color: '#f59e0b' }} />}
                    </div>
                  </td>
                  {showCompanyCol && (
                    <td style={{ padding: '12px 14px', borderBottom: B, fontSize: 12, opacity: 0.55, whiteSpace: 'nowrap' }}>
                      {u.tenant_name || '—'}
                    </td>
                  )}
                  <td style={{ padding: '12px 14px', borderBottom: B, fontSize: 12, opacity: 0.6 }}>{u.email}</td>
                  <td style={{ padding: '12px 14px', borderBottom: B }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: badge.bg, color: badge.color }}>
                      {roleMap[u.role] ?? `Role ${u.role}`}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: B, fontSize: 12, opacity: 0.55 }}>{u.quota > 0 ? u.quota.toLocaleString() : '—'}</td>
                  <td style={{ padding: '12px 14px', borderBottom: B }}>
                    <span onClick={e => { e.stopPropagation(); handleToggleActive(u.id, u.role) }}
                      style={{ cursor: perms.canUpdate && canEditTarget(u.role) ? 'pointer' : 'default', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: u.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: u.active ? '#10b981' : '#ef4444' }}>
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
