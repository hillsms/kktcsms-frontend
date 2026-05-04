import { useEffect, useRef, useState } from 'react'
import { usePermissionStore } from '@/stores/permissionStore'
import api from '@/api/client'
import {
  Building2, Plus, ChevronLeft, Save, Search, RefreshCw,
  ChevronRight, ChevronsLeft, ChevronsRight, Trash2, Minus,
  Check, X as XIcon, Star,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyItem {
  id: number; firm_name: string; domain: string; currency: string; credits: number
  trusted_sender: boolean; refundable: boolean; active: boolean; api_enabled: boolean
  api_username: string; created_at: string; ticket_disallowed: boolean
  has_custom_pricing: boolean
}
interface TxItem {
  id: number; transaction_type: number; credit: number; unit_price: number
  unit_price_currency: string; total_price: number; created_at: string
}
interface UserItem {
  id: number; name: string; username: string; email: string
  role: number; active: boolean; created_at: string; tenant_id: number
}

const B = '1px solid var(--border-color)'
const TX_LABELS: Record<number, string> = {
  0: 'Credit added', 1: 'Usage', 2: 'Fallback', 3: 'Refund', 4: 'Adjustment (+)', 5: 'Credit deleted',
}
const TX_OPTIONS = [
  { value: '', label: 'All Types' }, { value: '0', label: 'Credit added' },
  { value: '1', label: 'Usage' },   { value: '2', label: 'Fallback' },
  { value: '3', label: 'Refund' },  { value: '4', label: 'Adjustment (+)' },
  { value: '5', label: 'Credit deleted' },
]
const isDark = () =>
  document.documentElement.classList.contains('dark') ||
  document.documentElement.getAttribute('data-appearance') === 'dark' ||
  window.matchMedia('(prefers-color-scheme: dark)').matches

// ─── Checkbox filter ──────────────────────────────────────────────────────────

function CheckboxFilter({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        border: `2px solid ${checked ? 'var(--brand-500)' : 'rgba(255,255,255,0.25)'}`,
        backgroundColor: checked ? 'var(--brand-500)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
      }}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 12, fontWeight: checked ? 600 : 400, color: checked ? 'var(--brand-400)' : 'inherit', opacity: checked ? 1 : 0.65 }}>
        {label}
      </span>
    </div>
  )
}

// ─── PgBtn ────────────────────────────────────────────────────────────────────

function PgBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: active ? 700 : 500, cursor: disabled ? 'not-allowed' : 'pointer', backgroundColor: active ? 'var(--brand-600)' : 'var(--bg-input)', color: active ? '#fff' : 'inherit', border: `1px solid ${active ? 'var(--brand-600)' : 'var(--border-color)'}`, opacity: disabled ? 0.3 : 1, transition: 'all 0.15s' }}>
      {children}
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const { canCreate, canUpdate, canDelete } = usePermissionStore()
  const hasCreate = canCreate('companies')
  const hasUpdate = canUpdate('companies')
  const hasDelete = canDelete('companies')

  const [view, setView] = useState<'list' | 'detail' | 'new'>('list')
  const [roles, setRoles] = useState<Record<number, string>>({ 1: 'SuperAdmin', 2: 'Admin', 3: 'CompanyAdmin', 4: 'CompanyUser' })

  // ── List state ──────────────────────────────────────────────────────────────
  const [companies, setCompanies]   = useState<CompanyItem[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [pageSize]                  = useState(10)
  const [loading, setLoading]       = useState(true)
  const totalPages = Math.ceil(total / pageSize)

  // ── Search panel filters ────────────────────────────────────────────────────
  const [search,        setSearch]        = useState('')
  const [dateFrom,      setDateFrom]      = useState('')
  const [dateTo,        setDateTo]        = useState('')
  const [pricingFilter, setPricingFilter] = useState<'' | 'standard' | 'special'>('')
  const [creditMin,     setCreditMin]     = useState('')
  const [chkTrusted,       setChkTrusted]       = useState(false)
  const [chkRefundable,    setChkRefundable]    = useState(false)
  const [chkTicketAllowed, setChkTicketAllowed] = useState(false)
  const [trigger,       setTrigger]       = useState(0)

  // Sort state
  const [sortBy,   setSortBy]   = useState<string>('')
  const [sortDesc, setSortDesc] = useState(true)

  // Refs for stale closure fix
  const fSearch        = useRef(search)
  const fDateFrom      = useRef(dateFrom)
  const fDateTo        = useRef(dateTo)
  const fPricing       = useRef(pricingFilter)
  const fCreditMin     = useRef(creditMin)
  const fTrusted       = useRef(chkTrusted)
  const fRefundable    = useRef(chkRefundable)
  const fTicket        = useRef(chkTicketAllowed)
  const fSortBy        = useRef(sortBy)
  const fSortDesc      = useRef(sortDesc)

  useEffect(() => { fSearch.current     = search        }, [search])
  useEffect(() => { fDateFrom.current   = dateFrom      }, [dateFrom])
  useEffect(() => { fDateTo.current     = dateTo        }, [dateTo])
  useEffect(() => { fPricing.current    = pricingFilter }, [pricingFilter])
  useEffect(() => { fCreditMin.current  = creditMin     }, [creditMin])
  useEffect(() => { fTrusted.current    = chkTrusted       }, [chkTrusted])
  useEffect(() => { fRefundable.current = chkRefundable    }, [chkRefundable])
  useEffect(() => { fTicket.current     = chkTicketAllowed }, [chkTicketAllowed])
  useEffect(() => { fSortBy.current     = sortBy        }, [sortBy])
  useEffect(() => { fSortDesc.current   = sortDesc      }, [sortDesc])

  const hasFilters = !!(search || dateFrom || dateTo || pricingFilter || creditMin || chkTrusted || chkRefundable || chkTicketAllowed)

  // ── Detail state ────────────────────────────────────────────────────────────
  const [detail, setDetail]   = useState<CompanyItem | null>(null)
  const [editForm, setEditForm] = useState({ firm_name: '', domain: '', currency: 'TRY', trusted_sender: false, refundable: false, active: true, ticket_disallowed: false })
  const [saving, setSaving]   = useState(false)

  // Pricing
  const [pricingType, setPricingType] = useState<'standard' | 'special'>('standard')
  const [pLow, setPLow]       = useState('')
  const [pMedium, setPMedium] = useState('')
  const [pHigh, setPHigh]     = useState('')
  const [stdLow, setStdLow]       = useState('')
  const [stdMedium, setStdMedium] = useState('')
  const [stdHigh, setStdHigh]     = useState('')
  const [pSaving, setPSaving]     = useState(false)
  const [pResetting, setPResetting] = useState(false)

  // Credit modal
  const [creditModal, setCreditModal] = useState<'add' | 'remove' | null>(null)
  const [cmPrice, setCmPrice]         = useState('')
  const [cmUnitPrice, setCmUnitPrice] = useState('')
  const [cmManual, setCmManual]       = useState(false)
  const [cmCredits, setCmCredits]     = useState('')
  const [cmSaving, setCmSaving]       = useState(false)

  // Balance inquiry
  const [biModal, setBiModal] = useState(false)
  const [biDate, setBiDate]   = useState('')
  const [biCredit, setBiCredit] = useState('')

  // Transactions
  const [txs, setTxs]               = useState<TxItem[]>([])
  const [txTotal, setTxTotal]       = useState(0)
  const [txPage, setTxPage]         = useState(1)
  const [txPageSize, setTxPageSize] = useState(10)
  const [txTypeFilter, setTxTypeFilter] = useState('')
  const [txDateFrom, setTxDateFrom]     = useState('')
  const [txDateTo, setTxDateTo]         = useState('')
  const txPages = Math.ceil(txTotal / txPageSize)

  // Users
  const [allUsers, setAllUsers]         = useState<UserItem[]>([])
  const [userSearch, setUserSearch]     = useState('')
  const [userPage, setUserPage]         = useState(1)
  const [userPageSize, setUserPageSize] = useState(10)
  const filteredUsers = allUsers.filter(u => {
    if (!userSearch) return true
    const s = userSearch.toLowerCase()
    return u.username.toLowerCase().includes(s) || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
  })
  const userPages = Math.ceil(filteredUsers.length / userPageSize)
  const pagedUsers = filteredUsers.slice((userPage - 1) * userPageSize, userPage * userPageSize)

  // New company
  const [form, setForm] = useState({ firm_name: '', domain: '', currency: 'TRY', trusted_sender: false, refundable: false, ticket_disallowed: false })
  const [creating, setCreating] = useState(false)

  // Load roles
  useEffect(() => {
    api.get('/roles/list').then(r => {
      const map: Record<number, string> = {}
      ;(r.data.data ?? []).forEach((role: any) => { map[role.id] = role.name })
      if (Object.keys(map).length > 0) setRoles(map)
    }).catch(() => {})
  }, [])

  // ── Load companies ──────────────────────────────────────────────────────────

  const loadCompanies = (pg: number) => {
    setLoading(true)
    api.post('/tenants/list', {
      page:              pg,
      page_size:         pageSize,
      search:            fSearch.current        || undefined,
      date_from:         fDateFrom.current      || undefined,
      date_to:           fDateTo.current        || undefined,
      pricing_type:      fPricing.current       || undefined,
      credit_min:        fCreditMin.current     ? parseInt(fCreditMin.current) : undefined,
      trusted_sender:    fTrusted.current       || undefined,
      refundable:        fRefundable.current    || undefined,
      ticket_allowed:    fTicket.current        || undefined,
      sort_by:           fSortBy.current        || undefined,
      sort_desc:         fSortDesc.current,
    })
      .then(r => {
        const items = (r.data.data?.items ?? []).filter((c: any) => c.id !== 1)
        setCompanies(items)
        setTotal(r.data.data?.total ?? 0)
      })
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCompanies(page) }, [page, trigger])

  const applySearch = () => { setPage(1); setTrigger(t => t + 1) }

  const clearFilters = () => {
    setSearch('');         fSearch.current        = ''
    setDateFrom('');       fDateFrom.current      = ''
    setDateTo('');         fDateTo.current        = ''
    setCreditMin('');      fCreditMin.current     = ''
    setPricingFilter('');  fPricing.current       = ''
    setChkTrusted(false);       fTrusted.current       = false
    setChkRefundable(false);    fRefundable.current    = false
    setChkTicketAllowed(false); fTicket.current        = false
    setSortBy('');         fSortBy.current        = ''
    setSortDesc(true);     fSortDesc.current      = true
    setPage(1); setTrigger(t => t + 1)
  }

  const handleSort = (col: string) => {
    const newDesc = sortBy === col ? !sortDesc : true
    setSortBy(col);    fSortBy.current   = col
    setSortDesc(newDesc); fSortDesc.current = newDesc
    setPage(1); setTrigger(t => t + 1)
  }

  // ── Detail loaders ──────────────────────────────────────────────────────────

  const calcTierPrice = (credits: number): string => {
    const low = parseFloat(pLow) || 0; const med = parseFloat(pMedium) || 0; const high = parseFloat(pHigh) || 0
    if (!low && !med && !high) return '0.23'
    if (credits > 1000000 && high > 0) return String(high)
    if (credits > 500000 && med > 0) return String(med)
    return String(low || med || high)
  }

  const recalcCredits = (price: string, unitPrice: string) => {
    const p = parseFloat(price) || 0; let u = parseFloat(unitPrice) || 0
    if (u <= 0 || p <= 0) { setCmCredits('0'); return }
    if (!cmManual) {
      const credits = Math.floor(p / u); const tierPrice = calcTierPrice(credits)
      if (tierPrice !== unitPrice) { u = parseFloat(tierPrice) || u; setCmUnitPrice(tierPrice) }
    }
    setCmCredits(String(Math.floor(p / u)))
  }

  const loadDetail = (id: number) => {
    api.get(`/tenants/${id}`).then(r => {
      const t = r.data.data; setDetail(t)
      setEditForm({ firm_name: t.firm_name, domain: t.domain, currency: t.currency || 'TRY', trusted_sender: t.trusted_sender, refundable: t.refundable, active: t.active, ticket_disallowed: t.ticket_disallowed ?? false })
    }).catch(() => toast.error('Not found'))

    api.get(`/credits/pricing/${id}`).then(r => {
      const { pricing, type } = r.data.data ?? {}
      setPricingType(type === 'special' ? 'special' : 'standard')
      try {
        const parsed = JSON.parse(pricing?.sales_price ?? '{}')
        if (type === 'special') {
          setPLow(parsed.low || ''); setPMedium(parsed.medium || ''); setPHigh(parsed.high || '')
        } else {
          // Standard pricing — store as read-only reference
          setStdLow(parsed.low || ''); setStdMedium(parsed.medium || ''); setStdHigh(parsed.high || '')
          setPLow(''); setPMedium(''); setPHigh('')
        }
      } catch {
        setPLow(''); setPMedium(''); setPHigh('')
        setStdLow(''); setStdMedium(''); setStdHigh('')
      }
    }).catch(() => {})

    // Use company-users endpoint — returns CompanyAdmin + CompanyUser for this tenant
    api.post('/users/company-users', { tenant_id: id, page: 1, page_size: 500 })
      .then(r => {
        const items: UserItem[] = r.data.data?.items ?? []
        // Safety filter — ensure only this company's users are shown
        // (guards against backend TenantId binding issues for SuperAdmin scope)
        setAllUsers(items.filter(u => u.tenant_id === id))
      })
      .catch(() => {})
  }

  const loadTxs = (id: number, p: number, ps: number, typeF?: string, dateF?: string, dateT?: string) => {
    const payload: any = { tenant_id: id, page: p, page_size: ps }
    const tf = typeF ?? txTypeFilter; const df = dateF ?? txDateFrom; const dt = dateT ?? txDateTo
    if (tf) payload.transaction_type = parseInt(tf)
    if (df) payload.from_date = df
    if (dt) payload.to_date = dt
    api.post('/credits/transactions', payload)
      .then(r => { setTxs(r.data.data?.items ?? []); setTxTotal(r.data.data?.total ?? 0) })
      .catch(() => {})
  }

  const openDetail = (id: number) => {
    setTxPage(1); setTxTypeFilter(''); setTxDateFrom(''); setTxDateTo(''); setUserSearch(''); setUserPage(1)
    loadDetail(id); loadTxs(id, 1, txPageSize, '', '', ''); setView('detail')
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!detail) return; setSaving(true)
    try { await api.put(`/tenants/${detail.id}`, editForm); toast.success('Updated'); loadCompanies(page); loadDetail(detail.id) }
    catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setSaving(false) }
  }

  const handlePricingSave = async () => {
    if (!detail) return
    if (!pLow && !pMedium && !pHigh) { toast.error('Enter at least one price tier'); return }
    setPSaving(true)
    try {
      await api.post('/credits/pricing', {
        tenant_id:   detail.id,
        sales_price: JSON.stringify({ low: pLow, medium: pMedium, high: pHigh }),
        currency:    editForm.currency,
      })
      toast.success('Special pricing saved')
      setPricingType('special')
    }
    catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setPSaving(false) }
  }

  const handleResetToStandard = async () => {
    if (!detail || !confirm(`Remove special pricing for "${detail.firm_name}"? It will revert to standard pricing.`)) return
    setPResetting(true)
    try {
      await api.delete(`/credits/pricing/${detail.id}`)
      toast.success('Reverted to standard pricing')
      setPricingType('standard')
      setPLow(''); setPMedium(''); setPHigh('')
    }
    catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setPResetting(false) }
  }

  const openAddCredit = () => { setCreditModal('add'); setCmPrice(''); setCmManual(false); setCmUnitPrice(pLow || pMedium || pHigh || '0.23'); setCmCredits('') }
  const openRemoveCredit = () => { setCreditModal('remove'); setCmCredits('') }

  const handleCreditSubmit = async () => {
    if (!detail || !cmCredits || parseInt(cmCredits) <= 0) return; setCmSaving(true)
    try {
      if (creditModal === 'add') {
        await api.post('/credits/upload', { tenant_id: detail.id, credit: parseInt(cmCredits), unit_price: parseFloat(cmUnitPrice) || undefined, total_price: parseFloat(cmPrice) || undefined, currency: editForm.currency, auto_confirm: true })
        toast.success('Credit added')
      } else {
        await api.post('/credits/adjust', { tenant_id: detail.id, credit: parseInt(cmCredits), is_add: false })
        toast.success('Credit removed')
      }
      setCreditModal(null); loadDetail(detail.id); loadTxs(detail.id, 1, txPageSize)
    } catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setCmSaving(false) }
  }

  const handleDelete = async () => {
    if (!detail || !confirm(`Delete "${detail.firm_name}"?`)) return
    try { await api.delete(`/tenants/${detail.id}`); toast.success('Deleted'); setView('list'); setDetail(null); loadCompanies(page) }
    catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
  }

  const handleCreate = async () => {
    if (!form.firm_name || !form.domain) { toast.error('Name and domain required'); return }; setCreating(true)
    try { await api.post('/tenants/create', form); toast.success('Company created'); setView('list'); setForm({ firm_name: '', domain: '', currency: 'TRY', trusted_sender: false, refundable: false, ticket_disallowed: false }); loadCompanies(1) }
    catch (err: any) { toast.error(err.response?.data?.error ?? 'Failed') }
    finally { setCreating(false) }
  }

  const clearTxFilters = () => {
    setTxTypeFilter(''); setTxDateFrom(''); setTxDateTo(''); setTxPage(1)
    if (detail) loadTxs(detail.id, 1, txPageSize, '', '', '')
  }

  const Label = ({ children }: { children: string }) => (
    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4, marginBottom: 4, display: 'block' }}>{children}</label>
  )
  const YesNo = ({ val }: { val: boolean }) =>
    val ? <Check style={{ width: 16, height: 16, color: '#10b981' }} /> : <XIcon style={{ width: 16, height: 16, color: '#ef4444', opacity: 0.4 }} />

  const InlinePagination = ({ currentPage, totalPages: tp, totalRecords, pgSize, onPageChange, onPageSizeChange }: {
    currentPage: number; totalPages: number; totalRecords: number; pgSize: number
    onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void
  }) => {
    if (tp <= 0 && totalRecords <= 0) return null
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
        {tp > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PgBtn onClick={() => onPageChange(1)} disabled={currentPage === 1}><ChevronsLeft style={{ width: 12, height: 12 }} /></PgBtn>
            <PgBtn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft style={{ width: 12, height: 12 }} /></PgBtn>
            {Array.from({ length: Math.min(5, tp) }, (_, i) => {
              let p: number
              if (tp <= 5) p = i + 1
              else if (currentPage <= 3) p = i + 1
              else if (currentPage >= tp - 2) p = tp - 4 + i
              else p = currentPage - 2 + i
              return <PgBtn key={p} onClick={() => onPageChange(p)} active={currentPage === p}>{p}</PgBtn>
            })}
            <PgBtn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === tp}><ChevronRight style={{ width: 12, height: 12 }} /></PgBtn>
            <PgBtn onClick={() => onPageChange(tp)} disabled={currentPage === tp}><ChevronsRight style={{ width: 12, height: 12 }} /></PgBtn>
          </div>
        )}
        <span style={{ fontSize: 11, opacity: 0.4 }}>{totalRecords} records</span>
        <select className="input" value={pgSize} onChange={e => onPageSizeChange(parseInt(e.target.value))}
          style={{ width: 56, height: 28, fontSize: 11, padding: '0 4px' }}>
          {[5, 10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NEW COMPANY
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'new') {
    return (
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div onClick={() => setView('list')} style={{ cursor: 'pointer', padding: 8, opacity: 0.5 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}>
            <ChevronLeft style={{ width: 20, height: 20 }} />
          </div>
          <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>New Company</h1><p style={{ fontSize: 12, opacity: 0.4 }}>Register a new tenant</p></div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><Label>Company Name *</Label><input className="input" value={form.firm_name} onChange={e => setForm({ ...form, firm_name: e.target.value })} placeholder="Acme Corp" /></div>
              <div><Label>Domain *</Label><input className="input" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="acme.com" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, alignItems: 'end' }}>
              <div><Label>Currency</Label>
                <select className="input" style={{ colorScheme: isDark() ? 'dark' : 'light' }} value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                  <option value="TRY">TRY</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="AED">AED</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}><input type="checkbox" checked={form.trusted_sender} onChange={e => setForm({ ...form, trusted_sender: e.target.checked })} /><span style={{ fontSize: 12 }}>Trusted Sender</span></label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}><input type="checkbox" checked={form.refundable} onChange={e => setForm({ ...form, refundable: e.target.checked })} /><span style={{ fontSize: 12 }}>Refundable</span></label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}><input type="checkbox" checked={form.ticket_disallowed} onChange={e => setForm({ ...form, ticket_disallowed: e.target.checked })} /><span style={{ fontSize: 12 }}>Ticket Disallowed</span></label>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={handleCreate} disabled={creating} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus style={{ width: 14, height: 14 }} /> {creating ? 'Creating...' : 'Create Company'}
              </button>
              <button onClick={() => setView('list')} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COMPANY DETAIL  (unchanged from original)
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'detail' && detail) {
    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div onClick={() => { setView('list'); setDetail(null) }} style={{ cursor: 'pointer', padding: 8, opacity: 0.5 }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}>
              <ChevronLeft style={{ width: 20, height: 20 }} />
            </div>
            <div><h1 style={{ fontSize: 20, fontWeight: 700 }}>Company Detail</h1><p style={{ fontSize: 12, opacity: 0.4 }}>{detail.firm_name}</p></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {hasUpdate && <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Save style={{ width: 13, height: 13 }} /> {saving ? '...' : 'Update'}</button>}
            {hasDelete && detail.id !== 1 && (
              <button onClick={handleDelete} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Trash2 style={{ width: 13, height: 13 }} /> Remove
              </button>
            )}
          </div>
        </div>

        {/* Firm Info + Pricing */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Firm Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><Label>Firm Name</Label><input className="input" value={editForm.firm_name} onChange={e => setEditForm({ ...editForm, firm_name: e.target.value })} disabled={!hasUpdate} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={editForm.trusted_sender} onChange={e => setEditForm({ ...editForm, trusted_sender: e.target.checked })} disabled={!hasUpdate} /><span style={{ fontSize: 12 }}>Trusted Sender</span></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={editForm.refundable} onChange={e => setEditForm({ ...editForm, refundable: e.target.checked })} disabled={!hasUpdate} /><span style={{ fontSize: 12 }}>Refundable</span></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={editForm.ticket_disallowed} onChange={e => setEditForm({ ...editForm, ticket_disallowed: e.target.checked })} disabled={!hasUpdate} /><span style={{ fontSize: 12 }}>Ticket Disallowed</span></label>
              </div>
              <div><Label>Credit</Label><input className="input" value={detail.credits.toLocaleString()} disabled style={{ opacity: 0.5, fontWeight: 700 }} /></div>
            </div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Pricing</div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  backgroundColor: pricingType === 'special' ? 'rgba(139,92,246,0.12)' : 'var(--bg-hover)',
                  color: pricingType === 'special' ? '#8b5cf6' : 'inherit',
                  opacity: pricingType === 'special' ? 1 : 0.5,
                }}>
                  {pricingType === 'special' ? 'Special' : 'Standard'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {pricingType === 'special' && hasUpdate && (
                  <button onClick={handleResetToStandard} disabled={pResetting}
                    style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                    {pResetting ? '...' : 'Reset to Standard'}
                  </button>
                )}
                {hasUpdate && (
                  <button onClick={pricingType === 'standard' ? () => setPricingType('special') : handlePricingSave}
                    disabled={pSaving}
                    style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6, cursor: 'pointer', backgroundColor: 'var(--brand-600)', color: '#fff', border: 'none' }}>
                    {pricingType === 'standard' ? 'Set Special Pricing' : pSaving ? '...' : 'Save Pricing'}
                  </button>
                )}
              </div>
            </div>

            {/* Currency */}
            <div style={{ marginBottom: 14 }}>
              <Label>Currency</Label>
              <select className="input" style={{ colorScheme: isDark() ? 'dark' : 'light' }}
                value={editForm.currency} onChange={e => setEditForm({ ...editForm, currency: e.target.value })}
                disabled={!hasUpdate}>
                <option value="TRY">TRY</option><option value="USD">USD</option>
                <option value="EUR">EUR</option><option value="AED">AED</option>
              </select>
            </div>

            {/* Standard — read-only reference */}
            {pricingType === 'standard' && (
              <div style={{ padding: '12px 14px', borderRadius: 8, backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 10, fontWeight: 600 }}>
                  Global standard pricing (applies to all companies without special pricing)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Low (1–500k)', value: stdLow || '—' },
                    { label: 'Medium (500k–1M)', value: stdMedium || '—' },
                    { label: 'High (1M+)', value: stdHigh || '—' },
                  ].map(r => (
                    <div key={r.label} style={{ textAlign: 'center', padding: '8px 4px' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, opacity: 0.7 }}>{r.value}</div>
                      <div style={{ fontSize: 10, opacity: 0.35, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special — editable inputs */}
            {pricingType === 'special' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Reference row */}
                {(stdLow || stdMedium || stdHigh) && (
                  <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--bg-input)', fontSize: 11, opacity: 0.5 }}>
                    <span>Standard:</span>
                    {stdLow    && <span>Low {stdLow}</span>}
                    {stdMedium && <span>· Med {stdMedium}</span>}
                    {stdHigh   && <span>· High {stdHigh}</span>}
                  </div>
                )}
                <div><Label>Low (1 – 500,000)</Label>
                  <input className="input" value={pLow} onChange={e => setPLow(e.target.value)} placeholder={stdLow || '0.23'} />
                </div>
                <div><Label>Medium (500,000 – 1,000,000)</Label>
                  <input className="input" value={pMedium} onChange={e => setPMedium(e.target.value)} placeholder={stdMedium || '0.20'} />
                </div>
                <div><Label>High (above 1,000,000)</Label>
                  <input className="input" value={pHigh} onChange={e => setPHigh(e.target.value)} placeholder={stdHigh || '0.18'} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Credit Transactions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Credit Transactions</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={openAddCredit} style={{ fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><Plus style={{ width: 12, height: 12 }} /> Add credit</button>
              <button onClick={openRemoveCredit} style={{ fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}><Minus style={{ width: 12, height: 12 }} /> Remove credit</button>
              <button onClick={() => setBiModal(true)} style={{ fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}><Search style={{ width: 12, height: 12 }} /> Balance inquiry</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, opacity: 0.4 }}>Type:</span>
              <select className="input" value={txTypeFilter}
                onChange={e => { const v = e.target.value; setTxTypeFilter(v); setTxPage(1); if (detail) loadTxs(detail.id, 1, txPageSize, v, txDateFrom, txDateTo) }}
                style={{ width: 150, height: 32, fontSize: 11, padding: '0 6px' }}>
                {TX_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, opacity: 0.4 }}>From:</span>
              <input className="input" type="date" value={txDateFrom}
                onChange={e => { const v = e.target.value; setTxDateFrom(v); setTxPage(1); if (detail) loadTxs(detail.id, 1, txPageSize, txTypeFilter, v, txDateTo) }}
                style={{ height: 32, fontSize: 11, width: 140 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, opacity: 0.4 }}>To:</span>
              <input className="input" type="date" value={txDateTo}
                onChange={e => { const v = e.target.value; setTxDateTo(v); setTxPage(1); if (detail) loadTxs(detail.id, 1, txPageSize, txTypeFilter, txDateFrom, v) }}
                style={{ height: 32, fontSize: 11, width: 140 }} />
            </div>
            {(txTypeFilter || txDateFrom || txDateTo) && (
              <button onClick={clearTxFilters} style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>Clear</button>
            )}
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead><tr>
                {['Type', 'Credit', 'Total Price', 'Currency', 'Unit Price', 'Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid var(--brand-700)', backgroundColor: 'var(--bg-input)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {txs.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, opacity: 0.3, fontSize: 12, borderBottom: B }}>No transactions</td></tr>
                ) : txs.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 12 }}>{TX_LABELS[tx.transaction_type] || 'Unknown'}</td>
                    <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 12, fontWeight: 600 }}>{tx.credit.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 12 }}>{tx.total_price ? `${tx.unit_price_currency || editForm.currency} ${tx.total_price.toLocaleString('en', { minimumFractionDigits: 2 })}` : '—'}</td>
                    <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 12 }}>{tx.unit_price_currency || editForm.currency}</td>
                    <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 12 }}>{tx.unit_price ? `${tx.unit_price_currency || editForm.currency} ${tx.unit_price}` : '—'}</td>
                    <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 11, opacity: 0.5, whiteSpace: 'nowrap' }}>{new Date(tx.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <InlinePagination currentPage={txPage} totalPages={txPages} totalRecords={txTotal} pgSize={txPageSize}
            onPageChange={p => { setTxPage(p); if (detail) loadTxs(detail.id, p, txPageSize) }}
            onPageSizeChange={s => { setTxPageSize(s); setTxPage(1); if (detail) loadTxs(detail.id, 1, s) }} />
        </div>

        {/* Users */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Users</div>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, opacity: 0.4 }} />
              <input className="input" placeholder="Search" value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(1) }}
                style={{ paddingLeft: 28, width: 180, height: 32, fontSize: 11 }} />
            </div>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead><tr>
                {['Username', 'Active', 'Name', 'Email', 'Role', 'Created'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid var(--brand-700)', backgroundColor: 'var(--bg-input)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {pagedUsers.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, opacity: 0.3, fontSize: 12, borderBottom: B }}>No users</td></tr>
                ) : pagedUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 12, fontWeight: 600, color: 'var(--brand-500)', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {u.username}
                        {roles[u.role]?.toLowerCase().includes('admin') && (
                          <Star style={{ width: 12, height: 12, fill: '#f59e0b', color: '#f59e0b' }} />
                        )}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: B }}><YesNo val={u.active} /></td>
                    <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 12 }}>{u.name}</td>
                    <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 12, opacity: 0.5 }}>{u.email}</td>
                    <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 11 }}>{roles[u.role] || `Role ${u.role}`}</td>
                    <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 11, opacity: 0.4 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <InlinePagination currentPage={userPage} totalPages={userPages} totalRecords={filteredUsers.length} pgSize={userPageSize}
            onPageChange={p => setUserPage(p)} onPageSizeChange={s => { setUserPageSize(s); setUserPage(1) }} />
        </div>

        {/* Credit Modal */}
        {creditModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setCreditModal(null)}>
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 24, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{creditModal === 'add' ? `Add credit (${editForm.currency})` : 'Remove credit'}</h3>
                <button onClick={() => setCreditModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, fontSize: 18 }}>✕</button>
              </div>
              {creditModal === 'add' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div><Label>Price</Label><input className="input" type="number" value={cmPrice} autoFocus onChange={e => { setCmPrice(e.target.value); recalcCredits(e.target.value, cmUnitPrice) }} placeholder="0.00" style={{ fontSize: 16 }} /></div>
                  <div>
                    <Label>Unit price options</Label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setCmManual(false); const d = pLow || pMedium || pHigh || '0.23'; setCmUnitPrice(d); recalcCredits(cmPrice, d) }}
                        style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', backgroundColor: !cmManual ? 'var(--brand-600)' : 'var(--bg-input)', color: !cmManual ? '#fff' : 'inherit', border: `1px solid ${!cmManual ? 'var(--brand-600)' : 'var(--border-color)'}` }}>{pLow || '0.23'}</button>
                      <button onClick={() => setCmManual(true)}
                        style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: cmManual ? 'var(--brand-600)' : 'var(--bg-input)', color: cmManual ? '#fff' : 'inherit', border: `1px solid ${cmManual ? 'var(--brand-600)' : 'var(--border-color)'}` }}>Manual</button>
                    </div>
                  </div>
                  <div><Label>Unit price</Label><input className="input" type="text" value={cmUnitPrice} disabled={!cmManual} onChange={e => { setCmUnitPrice(e.target.value); recalcCredits(cmPrice, e.target.value) }} placeholder="0.23" style={{ opacity: cmManual ? 1 : 0.5 }} /></div>
                  <div><Label>Credit</Label><input className="input" value={cmCredits} disabled style={{ fontWeight: 700, fontSize: 18, opacity: 0.7, backgroundColor: 'var(--bg-input)' }} /></div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Available Balance</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: (detail?.credits ?? 0) > 0 ? '#10b981' : '#ef4444' }}>{(detail?.credits ?? 0).toLocaleString()} credits</div>
                  </div>
                  <div>
                    <Label>Credit amount to remove</Label>
                    <input className="input" type="number" min={1} max={detail?.credits ?? 0} value={cmCredits} onChange={e => setCmCredits(e.target.value)} placeholder="1000" autoFocus style={{ fontSize: 16 }} />
                    {cmCredits && parseInt(cmCredits) > (detail?.credits ?? 0) && (
                      <p style={{ fontSize: 12, marginTop: 6, color: '#f59e0b' }}>⚠ Cannot exceed {(detail?.credits ?? 0).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
                <button onClick={() => setCreditModal(null)} className="btn-secondary" style={{ fontSize: 13 }}>Cancel</button>
                <button onClick={handleCreditSubmit} disabled={cmSaving || !cmCredits || parseInt(cmCredits) <= 0} className="btn-primary" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {creditModal === 'add' ? <><Plus style={{ width: 14, height: 14 }} /> Add</> : <><Minus style={{ width: 14, height: 14 }} /> Remove</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Balance Inquiry Modal */}
        {biModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setBiModal(false)}>
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 24, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Balance Inquiry</h3>
                <button onClick={() => setBiModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, fontSize: 18 }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><Label>Transaction Date</Label><input className="input" type="date" value={biDate} onChange={e => setBiDate(e.target.value)} /></div>
                <div><Label>Credit Amount</Label><input className="input" type="number" value={biCredit} onChange={e => setBiCredit(e.target.value)} placeholder="Search by credit amount" /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
                <button onClick={() => setBiModal(false)} className="btn-secondary" style={{ fontSize: 13 }}>Cancel</button>
                <button className="btn-primary" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => {
                    if (biDate) { setTxDateFrom(biDate); setTxDateTo(biDate) }
                    setBiModal(false); setTxPage(1)
                    if (detail) loadTxs(detail.id, 1, txPageSize, txTypeFilter, biDate || '', biDate || '')
                    setBiDate(''); setBiCredit('')
                  }}>
                  <Search style={{ width: 14, height: 14 }} /> Search
                </button>
              </div>
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
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))' }}>
            <Building2 style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Companies</h1>
            <p style={{ fontSize: 11, opacity: 0.4 }}>{total} compan{total !== 1 ? 'ies' : 'y'}</p>
          </div>
        </div>
        {hasCreate && (
          <button onClick={() => setView('new')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Plus style={{ width: 14, height: 14 }} /> Add New Company
          </button>
        )}
      </div>

      {/* ── Search Panel ── */}
      <div className="card" style={{ padding: '10px 14px', marginBottom: 16 }}>

        {/* Line 1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>

          {/* Firm name */}
          <div style={{ position: 'relative', flex: '0 0 260px' }}>
            <Search style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', width: 11, height: 11, opacity: 0.35, pointerEvents: 'none' }} />
            <input type="text" placeholder="Search by firm name"
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applySearch()}
              className="input" style={{ paddingLeft: 24, width: '100%', height: 30, fontSize: 12 }} />
          </div>

          {/* Min credit */}
          <input type="number" placeholder="Min credit"
            value={creditMin} onChange={e => setCreditMin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applySearch()}
            className="input" style={{ width: 100, height: 30, fontSize: 12, flexShrink: 0 }} />

          {/* Date from */}
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="input" style={{ width: 126, height: 30, fontSize: 12, flexShrink: 0 }} />

          {/* Date to */}
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="input" style={{ width: 126, height: 30, fontSize: 12, flexShrink: 0 }} />

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {hasFilters && (
              <button onClick={clearFilters}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '0 9px', height: 30, borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                <XIcon style={{ width: 10, height: 10 }} /> Clear
              </button>
            )}
            <button onClick={applySearch} className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, height: 30, padding: '0 11px', whiteSpace: 'nowrap' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.4, whiteSpace: 'nowrap' }}>Pricing</span>
            <select className="input" value={pricingFilter}
              onChange={e => setPricingFilter(e.target.value as '' | 'standard' | 'special')}
              style={{ height: 26, fontSize: 11, width: 100, padding: '0 6px' }}>
              <option value="">All</option>
              <option value="standard">Standard</option>
              <option value="special">Special</option>
            </select>
          </div>
          <div style={{ width: 1, height: 14, backgroundColor: 'var(--border-color)', flexShrink: 0 }} />
          <CheckboxFilter label="Trusted Sender"  checked={chkTrusted}       onChange={setChkTrusted}       />
          <CheckboxFilter label="Refundable"      checked={chkRefundable}    onChange={setChkRefundable}    />
          <CheckboxFilter label="Ticket Allowed"  checked={chkTicketAllowed} onChange={setChkTicketAllowed} />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              {[
                { label: 'Firm Name',     col: 'firmname'   },
                { label: 'Active',        col: 'active'     },
                { label: 'Credit',        col: 'credits'    },
                { label: 'Currency',      col: 'currency'   },
                { label: 'Pricing',       col: 'pricing'    },
                { label: 'Trusted Sender',col: 'trusted'    },
                { label: 'Refundable',    col: 'refundable' },
                { label: 'Ticket Allowed',col: 'ticket'     },
                { label: 'Created',       col: 'created'    },
              ].map(({ label, col }) => {
                const active = sortBy === col
                return (
                  <th key={col}
                    onClick={() => handleSort(col)}
                    style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid var(--brand-700)', backgroundColor: 'var(--bg-input)', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', color: active ? 'var(--brand-400)' : 'inherit' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {label}
                      <span style={{ opacity: active ? 1 : 0.25, fontSize: 10 }}>
                        {active ? (sortDesc ? '↓' : '↑') : '↕'}
                      </span>
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, borderBottom: B }}>
                <div style={{ width: 24, height: 24, border: '3px solid var(--brand-600)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              </td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 13, borderBottom: B }}>No companies found</td></tr>
            ) : companies.map(c => (
              <tr key={c.id} onClick={() => openDetail(c.id)} style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '12px 14px', borderBottom: B, fontSize: 13, fontWeight: 600, color: 'var(--brand-500)' }}>{c.firm_name}</td>
                <td style={{ padding: '12px 14px', borderBottom: B, textAlign: 'center' }}><YesNo val={c.active} /></td>
                <td style={{ padding: '12px 14px', borderBottom: B, fontSize: 12, fontWeight: 600 }}>{c.credits.toLocaleString()}</td>
                <td style={{ padding: '12px 14px', borderBottom: B, fontSize: 12 }}>{c.currency || 'TRY'}</td>
                <td style={{ padding: '12px 14px', borderBottom: B }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                    backgroundColor: c.has_custom_pricing ? 'rgba(139,92,246,0.12)' : 'var(--bg-input)',
                    color: c.has_custom_pricing ? '#8b5cf6' : 'inherit',
                    opacity: c.has_custom_pricing ? 1 : 0.45,
                  }}>
                    {c.has_custom_pricing ? 'Special' : 'Standard'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', borderBottom: B, textAlign: 'center' }}><YesNo val={c.trusted_sender} /></td>
                <td style={{ padding: '12px 14px', borderBottom: B, textAlign: 'center' }}><YesNo val={c.refundable} /></td>
                <td style={{ padding: '12px 14px', borderBottom: B, textAlign: 'center' }}><YesNo val={!c.ticket_disallowed} /></td>
                <td style={{ padding: '12px 14px', borderBottom: B, fontSize: 11, opacity: 0.4, whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleDateString()}</td>
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
