import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { cx } from '@/utils/cn'
import { Card } from './Card'
import { Pagination } from './Pagination'
import { TableSkeleton } from './Skeleton'
import { EmptyState, ErrorState } from './EmptyState'

interface Props<T> {
  data: T[] | undefined
  columns: ColumnDef<T, unknown>[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  pageSize?: number
  empty?: { title: string; description?: string; action?: ReactNode }
  toolbar?: ReactNode
  onRowClick?: (row: T) => void
  footer?: ReactNode
  resetKey?: string
}

export function DataTable<T>({ data, columns, loading, error, onRetry, pageSize: initialSize = 10, empty, toolbar, onRowClick, footer, resetKey }: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: initialSize })
  const table = useReactTable({
    data: data ?? [], columns, state: { sorting, pagination }, onSortingChange: setSorting, onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(),
  })
  useEffect(() => { setPagination((p) => ({ ...p, pageIndex: 0 })) }, [resetKey])

  const rows = table.getRowModel().rows
  const total = data?.length ?? 0
  return (
    <Card className="overflow-hidden">
      {toolbar && <div className="border-b border-line p-4">{toolbar}</div>}
      {error ? <ErrorState message={error} onRetry={onRetry} /> : loading && !data ? <TableSkeleton cols={Math.min(columns.length - 1, 6)} /> : total === 0 ? (
        <EmptyState title={empty?.title ?? 'Sin resultados'} description={empty?.description ?? 'Ajuste los filtros o la búsqueda para ver registros.'} action={empty?.action} />
      ) : (
        <div className={cx('overflow-x-auto transition-opacity', loading && 'opacity-60')}>
          <table className="w-full min-w-max text-left text-[13px]">
            <thead className="bg-surface-2/90 text-[11px] uppercase tracking-[0.1em] text-muted">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-line">
                  {hg.headers.map((h) => {
                    const sortable = h.column.getCanSort()
                    const dir = h.column.getIsSorted()
                    return (
                      <th key={h.id} scope="col" className={cx('px-4 py-3.5 font-semibold', (h.column.columnDef.meta as { align?: string } | undefined)?.align === 'right' && 'text-right')} aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}>
                        {h.isPlaceholder ? null : sortable ? (
                          <button onClick={h.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 rounded uppercase tracking-[0.1em] transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {dir === 'asc' ? <ArrowUp className="size-3 text-primary" /> : dir === 'desc' ? <ArrowDown className="size-3 text-primary" /> : <ChevronsUpDown className="size-3 opacity-50" />}
                          </button>
                        ) : flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} onClick={onRowClick ? () => onRowClick(r.original) : undefined}
                  onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(r.original) } : undefined} tabIndex={onRowClick ? 0 : undefined}
                  className={cx('transition-colors hover:bg-primary-soft/40 focus-visible:bg-primary-soft/50 focus-visible:outline-none', onRowClick && 'cursor-pointer')}>
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id} className={cx('px-4 py-3 align-middle', (c.column.columnDef.meta as { align?: string } | undefined)?.align === 'right' && 'text-right tabular')}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            {footer}
          </table>
        </div>
      )}
      {!error && total > 0 && (
        <Pagination page={pagination.pageIndex} pageCount={table.getPageCount()} total={total} pageSize={pagination.pageSize}
          onPage={(p) => table.setPageIndex(p)} onPageSize={(n) => table.setPageSize(n)} />
      )}
    </Card>
  )
}
