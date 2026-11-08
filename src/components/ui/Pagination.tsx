import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from './Button'
import { Select } from './Select'

export function Pagination({ page, pageCount, total, pageSize, onPage, onPageSize }: { page: number; pageCount: number; total: number; pageSize: number; onPage: (p: number) => void; onPageSize?: (n: number) => void }) {
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-muted">
      <div className="flex items-center gap-3">
        <span className="tabular">Mostrando <b className="font-semibold text-ink">{from}–{to}</b> de <b className="font-semibold text-ink">{total}</b></span>
        {onPageSize && (
          <Select aria-label="Filas por página" size="sm" value={String(pageSize)} onChange={(e) => onPageSize(Number(e.target.value))} options={[10, 20, 50].map((n) => ({ value: String(n), label: `${n} / pág.` }))} className="w-28" />
        )}
      </div>
      <div className="flex items-center gap-1">
        <IconButton label="Página anterior" size="sm" variant="secondary" disabled={page === 0} onClick={() => onPage(page - 1)}><ChevronLeft /></IconButton>
        <span className="min-w-20 text-center tabular">Página <b className="text-ink">{pageCount === 0 ? 0 : page + 1}</b> / {pageCount}</span>
        <IconButton label="Página siguiente" size="sm" variant="secondary" disabled={page >= pageCount - 1} onClick={() => onPage(page + 1)}><ChevronRight /></IconButton>
      </div>
    </div>
  )
}
