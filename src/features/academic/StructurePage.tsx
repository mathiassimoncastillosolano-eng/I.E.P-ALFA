import { Lock, LockOpen, Plus } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAsync } from '@/hooks/useAsync'
import { useCan } from '@/hooks/usePermission'
import { academicService, type SectionView } from '@/services/academicService'
import { useUi } from '@/stores/uiStore'
import { notify } from '@/utils/toast'
import { cx } from '@/utils/cn'

export default function StructurePage() {
  const yearId = useUi((s) => s.yearId)
  const can = useCan()
  const sections = useAsync(() => academicService.sections(yearId), [yearId])
  const grades = useAsync(() => academicService.grades(), [])
  const years = useAsync(() => academicService.years(), [])
  const [edit, setEdit] = useState<SectionView | null>(null)
  const [cap, setCap] = useState('')
  const [busy, setBusy] = useState(false)
  const year = years.data?.find((y) => y.id === yearId)

  const save = async () => {
    if (!edit) return
    setBusy(true)
    try { await academicService.updateSection(edit.id, { capacity: Number(cap) }); notify.success('Capacidad actualizada'); setEdit(null) } catch (e) { notify.error(e) } finally { setBusy(false) }
  }
  const toggle = async (s: SectionView) => { try { await academicService.updateSection(s.id, { status: s.status === 'abierta' ? 'cerrada' : 'abierta' }); notify.success(`Sección ${s.name} ${s.status === 'abierta' ? 'cerrada' : 'abierta'}`) } catch (e) { notify.error(e) } }
  const add = async (gradeId: string) => { try { await academicService.createSection(yearId, gradeId, 30); notify.success('Sección creada') } catch (e) { notify.error(e) } }

  if (sections.error) return <Card><ErrorState message={sections.error} onRetry={sections.reload} /></Card>
  const levels = (['primaria', 'secundaria'] as const).map((lv) => ({ lv, grades: grades.data?.filter((g) => g.levelId === lv) ?? [] }))
  const totals = sections.data ? { cap: sections.data.reduce((a, s) => a + s.capacity, 0), occ: sections.data.reduce((a, s) => a + s.enrolled, 0) } : null

  return (
    <>
      <PageHeader eyebrow="Gestión académica" title="Grados y secciones" description={`Estructura académica ${year?.year ?? ''}: capacidad, vacantes y estado de cada sección.`}
        actions={totals && <div className="flex gap-3"><Badge tone="primary" dot={false}>{totals.occ} ocupadas</Badge><Badge tone="success" dot={false}>{totals.cap - totals.occ} vacantes</Badge></div>} />
      {!sections.data ? <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-[14px]" />)}</div> : levels.map(({ lv, grades: gs }) => (
        <section key={lv} className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{lv === 'primaria' ? 'Primaria' : 'Secundaria'}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {gs.map((g, gi) => {
              const secs = sections.data!.filter((s) => s.gradeId === g.id)
              return (
                <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.04 }}>
                  <Card className="h-full"><CardHeader title={g.name} description={`${secs.reduce((a, s) => a + s.enrolled, 0)} estudiantes`} action={<Button size="sm" variant="ghost" icon={<Plus />} disabled={!can('academic.write')} onClick={() => add(g.id)}>Sección</Button>} />
                    <ul className="space-y-3 px-5 pb-5">
                      {secs.map((s) => { const pct = Math.round((s.enrolled / s.capacity) * 100); return (
                        <li key={s.id}>
                          <div className="mb-1.5 flex items-center justify-between text-[13px]"><span className="flex items-center gap-2 font-medium">Sección {s.name}{s.status === 'cerrada' && <Badge tone="neutral" dot={false}>Cerrada</Badge>}</span>
                            <span className="flex items-center gap-1 text-muted"><button disabled={!can('academic.write')} onClick={() => { setEdit(s); setCap(String(s.capacity)) }} className="rounded px-1.5 py-0.5 tabular hover:bg-surface-3 hover:text-ink disabled:pointer-events-none"><b className="text-ink">{s.enrolled}</b>/{s.capacity}</button>
                              <button disabled={!can('academic.write')} onClick={() => toggle(s)} aria-label={s.status === 'abierta' ? 'Cerrar sección' : 'Abrir sección'} className="rounded p-1 hover:bg-surface-3 hover:text-ink disabled:opacity-40">{s.status === 'abierta' ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />}</button></span></div>
                          <div className="h-2 overflow-hidden rounded-full bg-surface-3"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={cx('h-full rounded-full', pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-primary')} /></div>
                          <p className="mt-1 text-xs text-muted">{s.vacancies} vacantes</p>
                        </li>) })}
                    </ul></Card>
                </motion.div>)
            })}
          </div>
        </section>
      ))}
      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={`Capacidad · Sección ${edit?.name}`} description={edit?.gradeName} size="sm" footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancelar</Button><Button loading={busy} onClick={save}>Guardar</Button></>}>
        <Input label="Capacidad de estudiantes" type="number" min={1} max={45} value={cap} onChange={(e) => setCap(e.target.value)} hint={`Ocupadas actualmente: ${edit?.enrolled ?? 0}`} />
      </Modal>
    </>
  )
}
