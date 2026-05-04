import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api/client'
import {
  Send, CheckCircle, XCircle, Clock, Building2, CreditCard,
  TrendingUp, AlertTriangle, RefreshCw,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  total_orders: number; today_orders: number; month_orders: number
  completed_orders: number; failed_orders: number; pending_orders: number
  total_delivered: number; total_undelivered: number; total_expired: number
  delivery_rate: number; total_tenants: number; total_credits: number
  recent_orders: RecentOrder[]
}

interface TenantStats {
  tenant_id: number; firm_name: string; credits: number
  total_orders: number; today_orders: number; month_orders: number
  total_delivered: number; total_undelivered: number; delivery_rate: number
  user_count: number
  monthly_stats: { year: number; month: number; order_count: number; delivered: number; undelivered: number }[]
}

interface RecentOrder {
  id: number; tenant_name: string; message_preview: string
  status: string; processed: number | null; delivered: number | null; created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const B = '1px solid var(--border-color)'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  completed:       { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  sending_started: { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  failed:          { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  cancelled:       { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
}
const statusStyle = (s: string) => STATUS_STYLE[s] ?? { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Sub-components ───────────────────────────────────────────────────────────

const Spinner = () => (
  <div style={{ width: 28, height: 28, border: '3px solid var(--brand-600)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
)

function MetricCard({ label, value, sub, icon: Icon, iconBg, valueColor }: {
  label: string; value: string; sub?: string
  icon: React.ElementType; iconBg: string; valueColor?: string
}) {
  return (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: iconBg }}>
        <Icon style={{ width: 17, height: 17 }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 21, fontWeight: 800, lineHeight: 1, color: valueColor ?? 'inherit' }}>{value}</div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.45, marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── Custom tooltip for recharts ──────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      <div style={{ fontWeight: 700, marginBottom: 4, opacity: 0.6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: p.fill }} />
          <span style={{ opacity: 0.65 }}>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore()
  const myRoleId: number   = (user as any)?.role_id ?? (user as any)?.role ?? 4
  const myTenantId: number = (user as any)?.tenant_id ?? 0
  const myScope: string    = (user as any)?.role_scope ?? 'own'
  const isOwnScope         = myScope === 'own'

  const [data,       setData]       = useState<DashboardData | null>(null)
  const [tenantData, setTenantData] = useState<TenantStats | null>(null)
  const [loading,    setLoading]    = useState(true)

  const load = () => {
    setLoading(true)
    const calls: Promise<any>[] = [
      api.get('/dashboard').then(r => setData(r.data.data)).catch(() => {}),
    ]
    // For own-scope users also load monthly breakdown
    if (isOwnScope && myTenantId && myTenantId !== 1) {
      calls.push(
        api.get(`/dashboard/tenant/${myTenantId}`)
          .then(r => setTenantData(r.data.data))
          .catch(() => {})
      )
    }
    Promise.all(calls).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!data) return (
    <div style={{ textAlign: 'center', padding: 60, opacity: 0.3 }}>
      <p style={{ fontSize: 14 }}>Failed to load dashboard</p>
    </div>
  )

  const monthlyChartData = tenantData?.monthly_stats.map(m => ({
    label: MONTHS[m.month - 1],
    delivered:   m.delivered,
    undelivered: m.undelivered,
  })) ?? []

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Dashboard</h1>
          <p style={{ fontSize: 11, opacity: 0.4 }}>
            {isOwnScope ? (user as any)?.tenant_name : 'All companies'} · {new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={load} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px' }}>
          <RefreshCw style={{ width: 13, height: 13 }} /> Refresh
        </button>
      </div>

      {/* ── Row 1 — Primary metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <MetricCard label="Total orders" value={data.total_orders.toLocaleString()}
          sub={`${data.month_orders.toLocaleString()} this month`}
          icon={Send} iconBg="color-mix(in srgb, var(--brand-600) 12%, transparent)" />
        <MetricCard label="Today's orders" value={data.today_orders.toLocaleString()}
          sub={`${data.pending_orders.toLocaleString()} pending`}
          icon={Clock} iconBg="rgba(245,158,11,0.12)" />
        <MetricCard label="Delivery rate" value={`${data.delivery_rate}%`}
          sub={`${data.total_delivered.toLocaleString()} delivered`}
          icon={TrendingUp} iconBg="rgba(16,185,129,0.12)" valueColor={data.delivery_rate >= 80 ? '#10b981' : '#f59e0b'} />
        <MetricCard label="Failed / expired" value={(data.failed_orders + data.total_expired).toLocaleString()}
          sub={`${data.total_undelivered.toLocaleString()} undelivered`}
          icon={XCircle} iconBg="rgba(239,68,68,0.10)" valueColor={data.failed_orders > 0 ? '#ef4444' : 'inherit'} />
      </div>

      {/* ── Row 2 — Secondary metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <MetricCard label="Active companies" value={data.total_tenants.toLocaleString()}
          icon={Building2} iconBg="rgba(59,130,246,0.10)" />
        <MetricCard label="Total credits" value={data.total_credits >= 1_000_000
            ? `${(data.total_credits / 1_000_000).toFixed(1)}M`
            : data.total_credits >= 1_000
              ? `${(data.total_credits / 1_000).toFixed(1)}K`
              : data.total_credits.toLocaleString()}
          sub="across all tenants" icon={CreditCard} iconBg="rgba(139,92,246,0.10)" />
        <MetricCard label="Completed orders" value={data.completed_orders.toLocaleString()}
          icon={CheckCircle} iconBg="rgba(16,185,129,0.10)" valueColor="#10b981" />
        <MetricCard label="Pending" value={data.pending_orders.toLocaleString()}
          icon={AlertTriangle} iconBg="rgba(245,158,11,0.10)" valueColor={data.pending_orders > 100 ? '#f59e0b' : 'inherit'} />
      </div>

      {/* ── Row 3 — Charts + Recent orders ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14, marginBottom: 14 }}>

        {/* Chart card */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20 }}>Order overview</div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Delivered',          value: data.total_delivered.toLocaleString(),                             color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
              { label: 'Failed/Undelivered', value: (data.failed_orders + data.total_undelivered).toLocaleString(),    color: '#ef4444', bg: 'rgba(239,68,68,0.08)'  },
              { label: 'Pending',            value: data.pending_orders.toLocaleString(),                              color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: s.bg, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.55, marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <ResponsiveContainer width="100%" height={170}>
            <BarChart
              data={monthlyChartData.length > 0 ? monthlyChartData : [
                { label: 'Completed',   delivered: data.completed_orders,   undelivered: 0,                      pending: 0 },
                { label: 'Undelivered', delivered: 0,                        undelivered: data.total_undelivered, pending: 0 },
                { label: 'Expired',     delivered: 0,                        undelivered: data.total_expired,     pending: 0 },
                { label: 'Pending',     delivered: 0,                        undelivered: 0,                      pending: data.pending_orders },
                { label: 'Failed',      delivered: 0,                        undelivered: data.failed_orders,     pending: 0 },
              ]}
              barCategoryGap="30%"
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="delivered"   name="Delivered"          fill="#10b981" radius={[3,3,0,0]} />
              <Bar dataKey="undelivered" name="Failed/Undelivered" fill="#ef4444" radius={[3,3,0,0]} />
              <Bar dataKey="pending"     name="Pending"            fill="#f59e0b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent orders */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Recent orders</div>
          {data.recent_orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 13 }}>No orders yet</div>
          ) : (
            <div>
              {data.recent_orders.slice(0, 8).map((o, i, arr) => {
                const ss = statusStyle(o.status)
                return (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arr.length - 1 ? B : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ opacity: 0.4, fontWeight: 400 }}>#{o.id}</span>
                        <span style={{ opacity: 0.7 }}>{o.tenant_name}</span>
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.45, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                        {o.message_preview}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, backgroundColor: ss.bg, color: ss.color }}>
                        {o.status.replace('_', ' ')}
                      </span>
                      <div style={{ fontSize: 10, opacity: 0.35, marginTop: 2 }}>
                        {new Date(o.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4 — Tenant stats (own-scope) or delivery breakdown ── */}
      {tenantData && (
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
            {tenantData.firm_name} — account overview
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
            {[
              { label: 'Credits',        value: tenantData.credits.toLocaleString(), color: 'var(--brand-500)' },
              { label: 'Total orders',   value: tenantData.total_orders.toLocaleString() },
              { label: 'This month',     value: tenantData.month_orders.toLocaleString() },
              { label: 'Today',          value: tenantData.today_orders.toLocaleString() },
              { label: 'Delivery rate',  value: `${tenantData.delivery_rate}%`, color: tenantData.delivery_rate >= 80 ? '#10b981' : '#f59e0b' },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ textAlign: 'center', padding: '12px 0', borderRight: i < arr.length - 1 ? B : 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color ?? 'inherit' }}>{s.value}</div>
                <div style={{ fontSize: 10, opacity: 0.4, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
