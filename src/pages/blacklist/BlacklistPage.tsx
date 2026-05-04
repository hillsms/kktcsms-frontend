import { useEffect, useState } from 'react'
import { usePermissionStore } from '@/stores/permissionStore'
import api from '@/api/client'
import {
  ShieldBan, Plus, Trash2, Search, RefreshCw,
  Globe, Building2, Phone, X as XIcon, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CompanyItem { id: number; firm_name: string }

type TabType = 'blacklist' | 'banlist'

const B = '1px solid var(--border-color)'

// ─── PgBtn ──────────────────────────────────────────────────────────────────

function PgBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: active ? 700 : 500, cursor: disabled ? 'not-allowed' : 'pointer', backgroundColor: active ? 'var(--brand-600)' : 'var(--bg-input)', color: active ? '#fff' : 'inherit', border: `1px solid ${active ? 'var(--brand-600)' : 'var(--border-color)'}`, opacity: disabled ? 0.3 : 1, transition: 'all 0.15s' }}>
      {children}
    </button>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function BlacklistPage() {
  const { canCreate, canDelete } = usePermissionStore()
  const hasCreate = canCreate('blacklist')
  const hasDelete = canDelete('blacklist')

  const [tab, setTab] = useState<TabType>('blacklist')

  // Global blacklist
  const [blacklist, setBlacklist] = useState<string[]>([])
  const [blTotal, setBlTotal] = useState(0)
  const [blPage, setBlPage] = useState(1)
  const [blSearch, setBlSearch] = useState('')
  const [blLoading, setBlLoading] = useState(false)
  const [blSelected, setBlSelected] = useState<Set<string>>(new Set())

  // Banlist
  const [banlist, setBanlist] = useState<string[]>([])
  const [bnTotal, setBnTotal] = useState(0)
  const [bnPage, setBnPage] = useState(1)
  const [bnSearch, setBnSearch] = useState('')
  const [bnLoading, setBnLoading] = useState(false)
  const [bnSelected, setBnSelected] = useState<Set<string>>(new Set())
  const [bnTenant, setBnTenant] = useState<number>(0)

  // Companies
  const [companies, setCompanies] = useState<CompanyItem[]>([])

  // Add modal
  const [showAdd, setShowAdd] = useState(false)
  const [addInput, setAddInput] = useState('')
  const [adding, setAdding] = useState(false)

  const [trigger, setTrigger] = useState(0)

  const pageSize = 25

  // ─── Load companies ──────────────────────────────────────────────────────
  useEffect(() => {
    api.post('/tenants/list', { page: 1, page_size: 500 })
      .then(r => {
        const items = (r.data.data?.items ?? []).filter((c: any) => c.id !== 1)
        setCompanies(items)
        if (items.length > 0 && !bnTenant) setBnTenant(items[0].id)
      })
      .catch(() => {})
  }, [])

  // ─── Load blacklist ──────────────────────────────────────────────────────
  useEffect(() => {
    if (tab === 'blacklist') loadBlacklist()
  }, [tab, blPage, trigger])

  const loadBlacklist = () => {
    setBlLoading(true)
    api.post('/blacklist/global/list', { page: blPage, page_size: pageSize, search: blSearch })
      .then(r => { setBlacklist(r.data.data?.items ?? []); setBlTotal(r.data.data?.total ?? 0) })
      .catch(() => toast.error('Failed to load blacklist'))
      .finally(() => setBlLoading(false))
  }

  // ─── Load banlist ────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab === 'banlist' && bnTenant > 0) loadBanlist()
  }, [tab, bnPage, bnTenant, trigger])

  const loadBanlist = () => {
    if (!bnTenant) return
    setBnLoading(true)
    api.post(`/blacklist/banlist/${bnTenant}/list`, { page: bnPage, page_size: pageSize, search: bnSearch })
      .then(r => { setBanlist(r.data.data?.items ?? []); setBnTotal(r.data.data?.total ?? 0) })
      .catch(() => toast.error('Failed to load banlist'))
      .finally(() => setBnLoading(false))
  }

  const applySearch = () => {
    if (tab === 'blacklist') { setBlPage(1); loadBlacklist() }
    else { setBnPage(1); loadBanlist() }
  }

  const clearFilters = () => {
    if (tab === 'blacklist') { setBlSearch(''); setBlPage(1) }
    else { setBnSearch(''); setBnPage(1) }
    setTrigger(t => t + 1)
  }

  // ─── Add phones ──────────────────────────────────────────────────────────
  const handleAdd = async () => {
    const phones = addInput.split(/[\n,;]+/).map(p => p.trim().replace(/\s+/g, '')).filter(p => p.length >= 7)
    if (phones.length === 0) { toast.error('Enter at least one valid phone number'); return }
    setAdding(true)
    try {
      if (tab === 'blacklist') {
        const res = await api.post('/blacklist/global/add', { phones })
        toast.success(`${res.data.data?.added ?? 0} numbers added to blacklist`)
      } else {
        if (!bnTenant) { toast.error('Select a company'); return }
        const res = await api.post(`/blacklist/banlist/${bnTenant}/add`, { phones })
        toast.success(`${res.data.data?.added ?? 0} numbers added to banlist`)
      }
      setShowAdd(false); setAddInput(''); setTrigger(t => t + 1)
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed to add') }
    finally { setAdding(false) }
  }

  // ─── Remove phones ───────────────────────────────────────────────────────
  const handleRemove = async (phones: string[]) => {
    if (phones.length === 0) return
    if (!confirm(phones.length === 1 ? `Remove ${phones[0]}?` : `Remove ${phones.length} numbers?`)) return
    try {
      if (tab === 'blacklist') {
        const res = await api.post('/blacklist/global/remove', { phones })
        toast.success(`${res.data.data?.removed ?? 0} removed`); setBlSelected(new Set())
      } else {
        const res = await api.post(`/blacklist/banlist/${bnTenant}/remove`, { phones })
        toast.success(`${res.data.data?.removed ?? 0} removed`); setBnSelected(new Set())
      }
      setTrigger(t => t + 1)
    } catch { toast.error('Failed to remove') }
  }

  // ─── Selection ───────────────────────────────────────────────────────────
  const currentList = tab === 'blacklist' ? blacklist : banlist
  const selected = tab === 'blacklist' ? blSelected : bnSelected
  const setSelected = tab === 'blacklist' ? setBlSelected : setBnSelected
  const search = tab === 'blacklist' ? blSearch : bnSearch
  const setSearch = tab === 'blacklist' ? setBlSearch : setBnSearch
  const total = tab === 'blacklist' ? blTotal : bnTotal
  const page = tab === 'blacklist' ? blPage : bnPage
  const setPage = tab === 'blacklist' ? setBlPage : setBnPage
  const loading = tab === 'blacklist' ? blLoading : bnLoading
  const totalPages = Math.ceil(total / pageSize)
  const hasSearch = !!search

  const toggleSelect = (phone: string) => {
    const next = new Set(selected); next.has(phone) ? next.delete(phone) : next.add(phone); setSelected(next)
  }
  const toggleAll = () => {
    selected.size === currentList.length ? setSelected(new Set()) : setSelected(new Set(currentList))
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
            <ShieldBan style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Blacklist & Banlist</h1>
            <p style={{ fontSize: 11, opacity: 0.4 }}>
              {tab === 'blacklist'
                ? `${blTotal} globally blocked number${blTotal !== 1 ? 's' : ''}`
                : `${bnTotal} banned number${bnTotal !== 1 ? 's' : ''} for ${companies.find(c => c.id === bnTenant)?.firm_name ?? 'company'}`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selected.size > 0 && hasDelete && (
            <button onClick={() => handleRemove(Array.from(selected))}
              style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 style={{ width: 13, height: 13 }} /> Remove ({selected.size})
            </button>
          )}
          {hasCreate && (
            <button onClick={() => { setShowAdd(true); setAddInput('') }} className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <Plus style={{ width: 14, height: 14 }} /> Add Numbers
            </button>
          )}
        </div>
      </div>

      {/* Search Panel */}
      <div className="card" style={{ padding: '10px 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          {/* Tab toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 6, padding: 2, flexShrink: 0 }}>
            <button onClick={() => { setTab('blacklist'); setBlSelected(new Set()) }}
              style={{ padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: tab === 'blacklist' ? 'var(--brand-600)' : 'transparent',
                color: tab === 'blacklist' ? '#fff' : 'inherit',
                display: 'flex', alignItems: 'center', gap: 4 }}>
              <Globe style={{ width: 11, height: 11 }} /> Global
            </button>
            <button onClick={() => { setTab('banlist'); setBnSelected(new Set()) }}
              style={{ padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: tab === 'banlist' ? 'var(--brand-600)' : 'transparent',
                color: tab === 'banlist' ? '#fff' : 'inherit',
                display: 'flex', alignItems: 'center', gap: 4 }}>
              <Building2 style={{ width: 11, height: 11 }} /> Company
            </button>
          </div>

          {/* Company dropdown — banlist only */}
          {tab === 'banlist' && (
            <select className="input" value={bnTenant}
              onChange={e => { setBnTenant(Number(e.target.value)); setBnPage(1); setBnSelected(new Set()) }}
              style={{ height: 30, fontSize: 12, width: 180, padding: '0 6px', flexShrink: 0 }}>
              <option value={0} disabled>Select Company</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.firm_name}</option>)}
            </select>
          )}

          {/* Search */}
          <div style={{ position: 'relative', flex: '0 0 260px' }}>
            <Search style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', width: 11, height: 11, opacity: 0.35, pointerEvents: 'none' }} />
            <input type="text" placeholder="Search phone number..."
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applySearch()}
              className="input" style={{ paddingLeft: 24, width: '100%', height: 30, fontSize: 12 }} />
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {hasSearch && (
              <button onClick={clearFilters}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '0 9px', height: 30, borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                <XIcon style={{ width: 10, height: 10 }} /> Clear
              </button>
            )}
            <button onClick={applySearch} className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, height: 30, padding: '0 11px' }}>
              <Search style={{ width: 11, height: 11 }} /> Search
            </button>
            <button onClick={() => setTrigger(t => t + 1)} className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', padding: '0 8px', height: 30 }}>
              <RefreshCw style={{ width: 11, height: 11 }} />
            </button>
          </div>
        </div>

        {/* Line 2 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 8, borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            backgroundColor: tab === 'blacklist' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
            color: tab === 'blacklist' ? '#ef4444' : '#3b82f6' }}>
            {tab === 'blacklist' ? 'GLOBAL BLACKLIST' : 'COMPANY BANLIST'}
          </span>
          <div style={{ width: 1, height: 14, backgroundColor: 'var(--border-color)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, opacity: 0.4 }}>
            {tab === 'blacklist'
              ? 'Numbers blocked across ALL companies'
              : bnTenant ? `Blocked for ${companies.find(c => c.id === bnTenant)?.firm_name ?? 'company'}` : 'Select a company'}
          </span>
          {selected.size > 0 && (
            <>
              <div style={{ width: 1, height: 14, backgroundColor: 'var(--border-color)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444' }}>{selected.size} selected</span>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead><tr>
            <th style={{ textAlign: 'center', padding: '12px 14px', fontSize: 10, fontWeight: 800, borderBottom: '2px solid var(--brand-700)', backgroundColor: 'var(--bg-input)', width: 44 }}>
              <input type="checkbox" checked={selected.size === currentList.length && currentList.length > 0} onChange={toggleAll} style={{ accentColor: 'var(--brand-500)' }} />
            </th>
            {['#', 'Phone Number', 'Type', ...(tab === 'banlist' ? ['Company'] : []), 'Actions'].map((h, i) => (
              <th key={h} style={{ textAlign: h === 'Actions' ? 'right' : 'left', padding: '12px 14px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid var(--brand-700)', backgroundColor: 'var(--bg-input)', width: h === '#' ? 50 : h === 'Actions' ? 80 : undefined }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={tab === 'banlist' ? 6 : 5} style={{ textAlign: 'center', padding: 40, borderBottom: B }}>
                <div style={{ width: 24, height: 24, border: '3px solid var(--brand-600)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              </td></tr>
            ) : currentList.length === 0 ? (
              <tr><td colSpan={tab === 'banlist' ? 6 : 5} style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 13, borderBottom: B }}>
                {tab === 'blacklist' ? 'No blacklisted numbers' : bnTenant ? 'No banned numbers for this company' : 'Select a company'}
              </td></tr>
            ) : currentList.map((phone, i) => (
              <tr key={phone} style={{ transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '10px 14px', borderBottom: B, textAlign: 'center' }}>
                  <input type="checkbox" checked={selected.has(phone)} onChange={() => toggleSelect(phone)} style={{ accentColor: 'var(--brand-500)' }} />
                </td>
                <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 11, opacity: 0.35 }}>{(page - 1) * pageSize + i + 1}</td>
                <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: 'var(--brand-500)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Phone style={{ width: 13, height: 13, opacity: 0.5 }} /> {phone}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', borderBottom: B }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                    backgroundColor: tab === 'blacklist' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
                    color: tab === 'blacklist' ? '#ef4444' : '#3b82f6' }}>
                    {tab === 'blacklist' ? 'Blacklist' : 'Banlist'}
                  </span>
                </td>
                {tab === 'banlist' && (
                  <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 12, opacity: 0.5 }}>
                    {companies.find(c => c.id === bnTenant)?.firm_name ?? '—'}
                  </td>
                )}
                <td style={{ padding: '10px 14px', borderBottom: B, textAlign: 'right' }}>
                  {hasDelete && (
                    <button onClick={() => handleRemove([phone])}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.4, transition: 'opacity 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}>
                      <Trash2 style={{ width: 14, height: 14, color: '#ef4444' }} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PgBtn onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft style={{ width: 14, height: 14 }} /></PgBtn>
            <PgBtn onClick={() => setPage(page - 1)} disabled={page === 1}><ChevronLeft style={{ width: 14, height: 14 }} /></PgBtn>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number
              if (totalPages <= 5) p = i + 1
              else if (page <= 3) p = i + 1
              else if (page >= totalPages - 2) p = totalPages - 4 + i
              else p = page - 2 + i
              return <PgBtn key={p} onClick={() => setPage(p)} active={page === p}>{p}</PgBtn>
            })}
            <PgBtn onClick={() => setPage(page + 1)} disabled={page === totalPages}><ChevronRight style={{ width: 14, height: 14 }} /></PgBtn>
            <PgBtn onClick={() => setPage(totalPages)} disabled={page === totalPages}><ChevronsRight style={{ width: 14, height: 14 }} /></PgBtn>
          </div>
          <span style={{ fontSize: 11, opacity: 0.4 }}>{total} records</span>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowAdd(false)}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 24, width: 460, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{tab === 'blacklist' ? 'Add to Global Blacklist' : 'Add to Company Banlist'}</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, fontSize: 18 }}>✕</button>
            </div>
            {tab === 'blacklist' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#ef4444' }}>
                <AlertTriangle style={{ width: 15, height: 15, flexShrink: 0 }} /> Global blacklist blocks numbers for ALL companies.
              </div>
            )}
            {tab === 'banlist' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(59,130,246,0.08)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#3b82f6' }}>
                <Building2 style={{ width: 15, height: 15, flexShrink: 0 }} /> Blocked for: <strong>{companies.find(c => c.id === bnTenant)?.firm_name ?? 'company'}</strong>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4, marginBottom: 4, display: 'block' }}>Phone Numbers</label>
              <textarea className="input"
                style={{ width: '100%', minHeight: 140, fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
                placeholder={'One per line:\n5321234567\n5331234567\n\nOr comma-separated:\n5321234567, 5331234567'}
                value={addInput} onChange={e => setAddInput(e.target.value)} autoFocus />
              <div style={{ fontSize: 11, opacity: 0.4, marginTop: 4 }}>
                {addInput.split(/[\n,;]+/).map(p => p.trim()).filter(p => p.length >= 7).length} valid numbers
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} className="btn-secondary" style={{ fontSize: 13 }}>Cancel</button>
              <button onClick={handleAdd} disabled={adding} className="btn-primary" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus style={{ width: 14, height: 14 }} /> {adding ? 'Adding...' : `Add ${addInput.split(/[\n,;]+/).map(p => p.trim()).filter(p => p.length >= 7).length} Numbers`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
