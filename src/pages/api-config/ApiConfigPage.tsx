import { useEffect, useState } from 'react'
import api from '@/api/client'
import { FileText, Plus, Trash2, Star, Edit3, Save, X, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import type { PagePermissions } from '@/components/layout/withPermissions'

interface Gateway {
  id: number; service_type: string; service_name: string; api_user: string
  originator: string; is_default: boolean; active: boolean; created_at: string
}

const SERVICE_TYPES = ['Yurtici', 'Turkcell', 'Telsim','Yurticisms']

const SERVICE_COLORS: Record<string, { bg: string; color: string }> = {
  Turkcell: { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  Telsim:   { bg: 'rgba(139,92,246,0.15)',  color: '#8b5cf6' },
  Yurtici:  { bg: 'color-mix(in srgb, var(--brand-600) 15%, transparent)', color: 'var(--brand-500)' },
}

const EMPTY_ADD = { service_type: 'Yurtici', service_name: '', api_user: '', api_password: '', originator: '', is_default: false }
const EMPTY_EDIT = { service_name: '', api_user: '', api_password: '', originator: '', is_default: false }

const B = '1px solid var(--border-color)'

const Label = ({ children }: { children: string }) => (
  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4, marginBottom: 4, display: 'block' }}>{children}</label>
)

export default function ApiConfigPage({ perms }: { perms: PagePermissions }) {
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [loading, setLoading] = useState(true)

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_ADD)
  const [adding, setAdding] = useState(false)

  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_EDIT)
  const [saving, setSaving] = useState(false)

  const loadGateways = () => {
    setLoading(true)
    api.get('/ApiConfig/gateways')
      .then((r) => setGateways(r.data.data ?? []))
      .catch(() => toast.error('Failed to load gateways'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadGateways() }, [])

  const handleAdd = async () => {
    if (!addForm.service_name || !addForm.api_user || !addForm.api_password) {
      toast.error('Service name, API user and password are required'); return
    }
    setAdding(true)
    try {
      await api.post('/ApiConfig/gateways', addForm)
      toast.success('Gateway added')
      setShowAdd(false); setAddForm(EMPTY_ADD); loadGateways()
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setAdding(false) }
  }

  const startEdit = (g: Gateway) => {
    setEditId(g.id)
    setEditForm({ service_name: g.service_name, api_user: g.api_user, api_password: '', originator: g.originator || '', is_default: g.is_default })
  }

  const handleEdit = async () => {
    if (!editId) return
    setSaving(true)
    try {
      const payload: any = { service_name: editForm.service_name, api_user: editForm.api_user, originator: editForm.originator, is_default: editForm.is_default }
      if (editForm.api_password) payload.api_password = editForm.api_password
      await api.put(`/ApiConfig/gateways/${editId}`, payload)
      toast.success('Gateway updated')
      setEditId(null); loadGateways()
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setSaving(false) }
  }

  const handleSetDefault = async (id: number) => {
    try { await api.post(`/ApiConfig/gateways/${id}/set-default`); toast.success('Set as default'); loadGateways() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this gateway?')) return
    try { await api.delete(`/ApiConfig/gateways/${id}`); toast.success('Deleted'); loadGateways() }
    catch { toast.error('Failed') }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))' }}>
            <FileText style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>API Management</h1>
            <p style={{ fontSize: 11, opacity: 0.4 }}>SMS gateway credentials & configuration</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadGateways} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw style={{ width: 13, height: 13 }} /> Refresh
          </button>
          {perms.canCreate && (
            <button onClick={() => setShowAdd(!showAdd)} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus style={{ width: 14, height: 14 }} /> Add API
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAdd && perms.canCreate && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.3, marginBottom: 14 }}>New Gateway</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <Label>Service Type *</Label>
              <select className="input" value={addForm.service_type} onChange={(e) => setAddForm({ ...addForm, service_type: e.target.value })}>
                {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><Label>Service Name *</Label><input className="input" value={addForm.service_name} onChange={(e) => setAddForm({ ...addForm, service_name: e.target.value })} placeholder="e.g. Superto" /></div>
            <div><Label>Originator</Label><input className="input" value={addForm.originator} onChange={(e) => setAddForm({ ...addForm, originator: e.target.value })} placeholder="05391003905" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginTop: 12, alignItems: 'end' }}>
            <div><Label>API User *</Label><input className="input" value={addForm.api_user} onChange={(e) => setAddForm({ ...addForm, api_user: e.target.value })} placeholder="Username" /></div>
            <div><Label>API Password *</Label><input className="input" type="password" value={addForm.api_password} onChange={(e) => setAddForm({ ...addForm, api_password: e.target.value })} placeholder="Password" /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}>
              <input type="checkbox" checked={addForm.is_default} onChange={(e) => setAddForm({ ...addForm, is_default: e.target.checked })} />
              <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>Default</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={handleAdd} disabled={adding} className="btn-primary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus style={{ width: 13, height: 13 }} /> {adding ? 'Adding...' : 'Add Gateway'}
            </button>
            <button onClick={() => { setShowAdd(false); setAddForm(EMPTY_ADD) }} className="btn-secondary" style={{ fontSize: 12 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Gateway list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 28, height: 28, border: '3px solid var(--brand-600)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : gateways.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', opacity: 0.3 }}>
          <FileText style={{ width: 36, height: 36, margin: '0 auto 10px' }} />
          <p>No gateways configured</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {gateways.map((g) => {
            const svcColor = SERVICE_COLORS[g.service_type] ?? SERVICE_COLORS.Yurtici
            return (
              <div key={g.id} className="card" style={{ padding: 0, overflow: 'hidden', opacity: g.active ? 1 : 0.5 }}>
                {editId === g.id ? (

                  /* ── Edit Mode ── */
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.3 }}>
                        Editing: {g.service_type} / {g.service_name}
                      </div>
                      <button onClick={() => { setEditId(null); setEditForm(EMPTY_EDIT) }} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, padding: 4 }}>
                        <X style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div><Label>Service Name</Label><input className="input" value={editForm.service_name} onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })} /></div>
                      <div><Label>API User</Label><input className="input" value={editForm.api_user} onChange={(e) => setEditForm({ ...editForm, api_user: e.target.value })} /></div>
                      <div><Label>Originator</Label><input className="input" value={editForm.originator} onChange={(e) => setEditForm({ ...editForm, originator: e.target.value })} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginTop: 12, alignItems: 'end' }}>
                      <div><Label>Password (empty = keep current)</Label><input className="input" type="password" value={editForm.api_password} onChange={(e) => setEditForm({ ...editForm, api_password: e.target.value })} placeholder="••••••••" /></div>
                      <div />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}>
                        <input type="checkbox" checked={editForm.is_default} onChange={(e) => setEditForm({ ...editForm, is_default: e.target.checked })} />
                        <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>Set as Default</span>
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <button onClick={handleEdit} disabled={saving} className="btn-primary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Save style={{ width: 13, height: 13 }} /> {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button onClick={() => { setEditId(null); setEditForm(EMPTY_EDIT) }} className="btn-secondary" style={{ fontSize: 12 }}>Cancel</button>
                    </div>
                  </div>

                ) : (

                  /* ── View Mode ── */
                  <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 16 }}>

                    <div style={{ width: 90, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, backgroundColor: svcColor.bg, color: svcColor.color }}>
                        {g.service_type}
                      </span>
                    </div>

                    <div style={{ width: 140, flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{g.service_name}</div>
                      {g.is_default && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                          <Star style={{ width: 10, height: 10, fill: '#f59e0b', color: '#f59e0b' }} />
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Default</span>
                        </div>
                      )}
                    </div>

                    {[{ label: 'User', value: g.api_user }, { label: 'Password', value: '••••••••' }, { label: 'Originator', value: g.originator || '—' }].map(({ label, value }) => (
                      <div key={label} style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, opacity: 0.35, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                        <div style={{ fontSize: 13, fontFamily: label === 'Originator' ? 'monospace' : undefined }}>{value}</div>
                      </div>
                    ))}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 'auto' }}>
                      {perms.canUpdate && !g.is_default && (
                        <button onClick={() => handleSetDefault(g.id)}
                          style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid var(--brand-500)', color: 'var(--brand-500)', whiteSpace: 'nowrap' }}>
                          Set Default
                        </button>
                      )}
                      {perms.canUpdate && (
                        <button onClick={() => startEdit(g)}
                          style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'var(--bg-input)', border: B, color: 'inherit' }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--brand-500)'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                          <Edit3 style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                      {perms.canDelete && (
                        <button onClick={() => handleDelete(g.id)}
                          style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
