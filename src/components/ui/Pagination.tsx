import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

// ─── PgBtn ───────────────────────────────────
export function PgBtn({ children, onClick, disabled, active }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 28, height: 28, borderRadius: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: active ? 700 : 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      backgroundColor: active ? 'var(--brand-600)' : 'var(--bg-input)',
      color: active ? '#fff' : 'inherit',
      border: `1px solid ${active ? 'var(--brand-600)' : 'var(--border-color)'}`,
      opacity: disabled ? 0.3 : 1, transition: 'all 0.15s',
    }}>
      {children}
    </button>
  )
}

// ─── Pagination ──────────────────────────────
// Usage:
//   <Pagination page={page} total={total} pageSize={pageSize}
//     onPageChange={setPage}
//     onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
//   />
interface PaginationProps {
  page: number
  total: number
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange?: (s: number) => void
  pageSizeOptions?: number[]
  align?: 'center' | 'between'
}

export function Pagination({
  page, total, pageSize,
  onPageChange, onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  align = 'center',
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (total === 0) return null

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap',
      justifyContent: align === 'center' ? 'center' : 'space-between',
    }}>
      {/* Page buttons */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <PgBtn onClick={() => onPageChange(1)} disabled={page === 1}><ChevronsLeft style={{ width: 12, height: 12 }} /></PgBtn>
          <PgBtn onClick={() => onPageChange(page - 1)} disabled={page === 1}><ChevronLeft style={{ width: 12, height: 12 }} /></PgBtn>
          {pages.map((p) => <PgBtn key={p} onClick={() => onPageChange(p)} active={page === p}>{p}</PgBtn>)}
          <PgBtn onClick={() => onPageChange(page + 1)} disabled={page === totalPages}><ChevronRight style={{ width: 12, height: 12 }} /></PgBtn>
          <PgBtn onClick={() => onPageChange(totalPages)} disabled={page === totalPages}><ChevronsRight style={{ width: 12, height: 12 }} /></PgBtn>
        </div>
      )}

      {/* Record count */}
      <span style={{ fontSize: 11, opacity: 0.4 }}>
        {from}–{to} / {total} records
      </span>

      {/* Page size selector */}
      {onPageSizeChange && (
        <select className="input" value={pageSize}
          onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
          style={{ width: 56, height: 28, fontSize: 11, padding: '0 4px' }}>
          {pageSizeOptions.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      )}
    </div>
  )
}
