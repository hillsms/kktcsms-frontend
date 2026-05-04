import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api/client'
import { DollarSign, Save, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Pagination } from '@/components/ui/Pagination'
import type { PagePermissions } from '@/components/layout/withPermissions'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceItem {
  id: number
  tenant_id: number
  consumer_tenant_id: number | null
  sales_price: string
  currency: string
  created_at: string
}
interface PriceTiers { low: string; medium: string; high: string }
interface Company    { id: number; firm_name: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const B = '1px solid var(--border-color)'
const TH: React.CSSProperties = {
  textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 800,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  borderBottom: '2px solid var(--brand-700)', backgroundColor: 'var(--bg-input)',
}
const CURRENCIES = ['TRY']
const TIERS = [
  { key: 'low',    label: 'Low',    desc: '1 – 500,000'          },
  { key: 'medium', label: 'Medium', desc: '500,000 – 1,000,000'  },
  { key: 'high',   label: 'High',   desc: 'above 1,000,000'      },
] as const

const EMPTY_TIERS: PriceTiers = { low: '', medium: '', high: '' }

const parseTiers = (json: string): PriceTiers => {
  try { return JSON.parse(json) } catch { return { low: json, medium: '', high: '' } }
}

const Spinner = () => (
  <div style={{ width: 24, height: 24, border: '3px solid var(--brand-600)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
)

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CreditsPage({ perms }: { perms: PagePermissions }) {
  const { user } = useAuthStore()
  const myRoleId: number = (user as any)?.role_id ?? (user as any)?.role ?? 4
  const myTenantId: number = (user as any)?.tenant_id ?? 1
  const isAdmin = myRoleId <= 2

  // Company selector (admin only)
  const [companies,      setCompanies]      = useState<Company[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>(isAdmin ? '1' : String(myTenantId))

  const tenantId = selectedTenant ? parseInt(selectedTenant) : (isAdmin ? 1 : myTenantId)
  const isStandardSelected = tenantId === 1

  // Pricing form
  const [currency,  setCurrency]  = useState('TRY')
  const [tiers,     setTiers]     = useState<PriceTiers>(EMPTY_TIERS)
  const [saving,    setSaving]    = useState(false)
  const [resetting, setResetting] = useState(false)
  const [hasSpecial, setHasSpecial] = useState(false)

  // Standard pricing reference
  const [standardTiers,    setStandardTiers]    = useState<PriceTiers>(EMPTY_TIERS)
  const [standardCurrency, setStandardCurrency] = useState('TRY')

  // History
  const [history,  setHistory]  = useState<PriceItem[]>([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading,  setLoading]  = useState(true)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const skipTenantEffect = useRef(true)  // skip tenantId effect on initial mount
  const skipPageEffect   = useRef(true)  // skip page effect on initial mount

  // ── Helpers ───────────────────────────────────────────────────────────────

  const loadCurrentPricing = (tid: number, isStd: boolean) => {
    api.get(`/credits/pricing/${tid}`)
      .then(r => {
        const prices = r.data.data ?? []
        if (prices.length > 0) {
          const latest = prices[0]
          setCurrency(latest.currency || 'TRY')
          setTiers(parseTiers(latest.sales_price))
          setHasSpecial(!isStd)
        } else {
          setCurrency(standardCurrency)
          setTiers({ ...standardTiers })
          setHasSpecial(false)
        }
      })
      .catch(() => {})
  }

  const loadHistory = (p: number, tid?: number) => {
    setLoading(true)
    api.post('/credits/pricing/history', { tenant_id: tid ?? tenantId, page: p, page_size: pageSize })
      .then(r => { setHistory(r.data.data?.items ?? []); setTotal(r.data.data?.total ?? 0) })
      .catch(() => toast.error('Failed to load pricing history'))
      .finally(() => setLoading(false))
  }

  // ── Boot — loads everything once ─────────────────────────────────────────

  useEffect(() => {
    if (isAdmin) {
      // Load standard pricing (reference + current display for tenant=1)
      api.get('/credits/pricing/1')
        .then(r => {
          const prices = r.data.data ?? []
          if (prices.length > 0) {
            const latest = prices[0]
            setStandardCurrency(latest.currency || 'TRY')
            setStandardTiers(parseTiers(latest.sales_price))
            setCurrency(latest.currency || 'TRY')
            setTiers(parseTiers(latest.sales_price))
            setHasSpecial(false)
          }
        })
        .catch(() => {})

      // Company list
      api.post('/tenants/list', { page: 1, page_size: 500 })
        .then(r => setCompanies(r.data.data?.items ?? []))
        .catch(() => {})

      // Initial history for tenant=1
      loadHistory(1, 1)
    } else {
      // Non-admin: load their own tenant
      loadCurrentPricing(myTenantId, false)
      loadHistory(1, myTenantId)
    }
  }, [])

  // ── Tenant change — skip initial mount (boot handles it) ─────────────────

  useEffect(() => {
    if (skipTenantEffect.current) { skipTenantEffect.current = false; return }
    skipPageEffect.current = true
    loadCurrentPricing(tenantId, isStandardSelected)
    loadHistory(1, tenantId)
    setPage(1)
  }, [tenantId])

  // ── Page / pageSize change only — skip initial mount ──────────────────────

  useEffect(() => {
    if (skipPageEffect.current) { skipPageEffect.current = false; return }
    loadHistory(page)
  }, [page, pageSize])

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
  const low = parseFloat(tiers.low)
  const med = parseFloat(tiers.medium)
  const high = parseFloat(tiers.high)

  if (isNaN(low) && isNaN(med) && isNaN(high)) {
    toast.error('Enter at least one price tier'); return
  }

  
  if (tiers.low && (isNaN(low) || low <= 0)) { toast.error('Low must be a positive number'); return }
  if (tiers.medium && (isNaN(med) || med <= 0)) { toast.error('Medium must be a positive number'); return }
  if (tiers.high && (isNaN(high) || high <= 0)) { toast.error('High must be a positive number'); return }

  // Validate: Low ≤ Medium ≤ High
  if (!isNaN(low) && !isNaN(med) && low > med) {
    toast.error('Low price must be less than or equal to Medium'); return
  }
  if (!isNaN(med) && !isNaN(high) && med > high) {
    toast.error('Medium price must be less than or equal to High'); return
  }
  if (!isNaN(low) && !isNaN(high) && low > high) {
    toast.error('Low price must be less than or equal to High'); return
  }
    setSaving(true)
    try {
      await api.post('/credits/pricing', {
        tenant_id:   tenantId,
        sales_price: JSON.stringify(tiers),
        currency,
      })
      toast.success(isStandardSelected ? 'Standard pricing updated' : 'Special pricing saved')
      if (!isStandardSelected) setHasSpecial(true)
      loadHistory(1); setPage(1)
      if (isStandardSelected) { setStandardTiers({ ...tiers }); setStandardCurrency(currency) }
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed')
    } finally { setSaving(false) }
  }

  const handleResetToStandard = async () => {
    if (!confirm(`Remove special pricing for this company? It will revert to standard pricing.`)) return
    setResetting(true)
    try {
      await api.delete(`/credits/pricing/${tenantId}`)
      toast.success('Reverted to standard pricing')
      setHasSpecial(false)
      setCurrency(standardCurrency)
      setTiers({ ...standardTiers })
      loadHistory(1); setPage(1)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed')
    } finally { setResetting(false) }
  }

  // ── Pricing badge ─────────────────────────────────────────────────────────

  const pricingLabel = isStandardSelected
    ? 'Standard (Global)'
    : hasSpecial ? 'Special' : 'Standard'

  const pricingBadgeStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 4,
    backgroundColor: (!isStandardSelected && hasSpecial)
      ? 'rgba(139,92,246,0.12)'
      : isStandardSelected
        ? 'rgba(16,185,129,0.10)'
        : 'var(--bg-input)',
    color: (!isStandardSelected && hasSpecial)
      ? '#8b5cf6'
      : isStandardSelected
        ? '#10b981'
        : 'inherit',
    opacity: (!isStandardSelected && !hasSpecial) ? 0.45 : 1,
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))' }}>
            <DollarSign style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Pricing</h1>
            <p style={{ fontSize: 11, opacity: 0.4 }}>SMS unit pricing per volume tier</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isStandardSelected && hasSpecial && perms.canUpdate && (
            <button onClick={handleResetToStandard} disabled={resetting}
              style={{ fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw style={{ width: 13, height: 13 }} />
              {resetting ? 'Resetting...' : 'Reset to Standard'}
            </button>
          )}
          {perms.canUpdate && (
            <button onClick={handleSave} disabled={saving} className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <Save style={{ width: 14, height: 14 }} />
              {saving ? 'Saving...' : isStandardSelected ? 'Save Standard' : hasSpecial ? 'Update Special' : 'Set Special Pricing'}
            </button>
          )}
        </div>
      </div>

      {/* Company selector — admin only */}
      {isAdmin && (
        <div className="card" style={{ padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.5, flexShrink: 0 }}>Company:</span>
          <select className="input" value={selectedTenant}
            onChange={e => setSelectedTenant(e.target.value)}
            style={{ width: 300, height: 34, fontSize: 13 }}>
            <option value="1">KKTC SMS — Standard Pricing (Global)</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.firm_name}</option>
            ))}
          </select>
          <span style={pricingBadgeStyle}>{pricingLabel}</span>
          {!isStandardSelected && !hasSpecial && (standardTiers.low || standardTiers.medium || standardTiers.high) && (
            <span style={{ fontSize: 11, opacity: 0.4, marginLeft: 4 }}>
              Using standard: {standardTiers.low} / {standardTiers.medium} / {standardTiers.high} {standardCurrency}
            </span>
          )}
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ── Left: Pricing Form ── */}
        <div className="card" style={{ padding: 20, height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {isStandardSelected ? 'Standard Pricing' : 'Company Pricing'}
            </div>
            <span style={pricingBadgeStyle}>{pricingLabel}</span>
          </div>

          {!isStandardSelected && !hasSpecial && (
            <div style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', marginBottom: 16, fontSize: 12, opacity: 0.6, lineHeight: 1.6 }}>
              This company has no special pricing. It uses the global standard rates below.
              Edit the values and click <strong>Set Special Pricing</strong> to override.
            </div>
          )}

          {isStandardSelected && (
            <div style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', marginBottom: 16, fontSize: 12, color: '#10b981', lineHeight: 1.6 }}>
              This is the global default. All companies without special pricing use these rates.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.4, marginBottom: 4 }}>Currency</div>
              <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}
                style={{ width: '100%' }} disabled={!perms.canUpdate}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {TIERS.map(({ key, label, desc }) => (
              <div key={key}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.4, marginBottom: 4 }}>
                  {label} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({desc})</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input className="input" type="text" inputMode="decimal"
                    value={tiers[key]}
                    onChange={e => {
                        const val = e.target.value
                        if (val === '' || /^\d*\.?\d{0,4}$/.test(val)) {
                          setTiers({ ...tiers, [key]: val })
                        }
                      }}
                    placeholder={standardTiers[key] || '0.23'}
                    style={{ width: '100%', paddingRight: 48 }}
                    disabled={!perms.canUpdate} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, opacity: 0.35, pointerEvents: 'none' }}>
                    {currency}
                  </span>
                </div>
                {!isStandardSelected && standardTiers[key] && (
                  <div style={{ fontSize: 10, opacity: 0.35, marginTop: 3 }}>
                    Standard: {standardTiers[key]} {standardCurrency}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: History ── */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            {isStandardSelected ? 'Standard Pricing History' : 'Special Pricing History'}
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['Currency', 'Low', 'Medium', 'High', 'Set At'].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, borderBottom: B }}><Spinner /></td></tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 13, borderBottom: B }}>
                      {isStandardSelected ? 'No standard pricing history' : 'No special pricing set for this company'}
                    </td>
                  </tr>
                ) : history.map((p, idx) => {
                  const t = parseTiers(p.sales_price)
                  const isLatest = idx === 0 && page === 1
                  return (
                    <tr key={p.id} style={{ backgroundColor: isLatest ? 'color-mix(in srgb, var(--brand-600) 6%, transparent)' : 'transparent' }}>
                      <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 12 }}>
                        <span style={{ fontWeight: isLatest ? 700 : 400, color: isLatest ? 'var(--brand-500)' : undefined }}>
                          {p.currency}
                        </span>
                        {isLatest && (
                          <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, backgroundColor: 'var(--brand-600)', color: '#fff' }}>
                            CURRENT
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 12 }}>{t.low    || '—'}</td>
                      <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 12 }}>{t.medium || '—'}</td>
                      <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 12 }}>{t.high   || '—'}</td>
                      <td style={{ padding: '10px 14px', borderBottom: B, fontSize: 11, opacity: 0.45, whiteSpace: 'nowrap' }}>
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page} total={total} pageSize={pageSize}
            onPageChange={p => setPage(p)}
            onPageSizeChange={s => { setPageSize(s); setPage(1) }}
          />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
