import { CornerDownLeft, GraduationCap, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { Avatar } from '@/components/ui/Avatar'
import { useDebounced } from '@/hooks/useDebounced'
import { studentService } from '@/services/studentService'
import { NAV } from '../router/routes'
import type { StudentRow } from '@/types'

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState('')
  const dq = useDebounced(q, 200)
  const [res, setRes] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
    if (!dq.trim()) { setRes([]); return }
    let live = true
    setLoading(true)
    studentService.search(dq).then((r) => { if (live) { setRes(r); setLoading(false) } })
    return () => { live = false }
  }, [dq])
  const pages = NAV.flatMap((g) => g.items).filter((i) => q && i.label.toLowerCase().includes(q.toLowerCase())).slice(0, 4)
  const go = (to: string) => { onOpenChange(false); setQ(''); navigate(to) }
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQ('') }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0a1130]/50 backdrop-blur-[3px] data-[state=open]:animate-fade" />
        <Dialog.Content className="fixed left-1/2 top-[12%] z-50 w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-surface shadow-pop data-[state=open]:animate-pop">
          <Dialog.Title className="sr-only">Búsqueda global</Dialog.Title>
          <Dialog.Description className="sr-only">Busque estudiantes por nombre, DNI o código, o salte a una página.</Dialog.Description>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="size-4 text-muted" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, DNI o código de estudiante…" className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted" />
            <kbd className="rounded border border-line-strong px-1.5 py-0.5 text-[10px] text-muted">ESC</kbd>
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {!q && <p className="px-3 py-8 text-center text-sm text-muted">Escriba para buscar estudiantes o páginas del sistema.</p>}
            {loading && <p className="px-3 py-3 text-sm text-muted">Buscando…</p>}
            {pages.map((p) => (
              <button key={p.to} onClick={() => go(p.to)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-surface-3"><p.icon className="size-4 text-primary" />{p.label}<CornerDownLeft className="ml-auto size-3.5 text-muted" /></button>
            ))}
            {res.map((s) => (
              <button key={s.id} onClick={() => go(`/academico/estudiantes/${s.id}`)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface-3">
                <Avatar name={s.fullName} size="sm" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.fullName}</p><p className="text-xs text-muted">DNI {s.dni} · {s.gradeName ?? 'Sin matrícula'}</p></div>
                <GraduationCap className="size-4 text-muted" />
              </button>
            ))}
            {q && !loading && !res.length && !pages.length && <p className="px-3 py-8 text-center text-sm text-muted">Sin resultados para “{q}”.</p>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
