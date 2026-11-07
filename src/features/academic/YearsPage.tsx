import { CalendarCheck2, CalendarPlus, CheckCircle2, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/Confirm'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAsync } from '@/hooks/useAsync'
import { useCan } from '@/hooks/usePermission'
import { academicService } from '@/services/academicService'
import type { AcademicYear, EconomicConfig } from '@/types'
import { MONTH_NAMES } from '@/constants'
import { fmtDate, money } from '@/utils/format'
import { notify } from '@/utils/toast'

const tone = { activo: 'success', planificado: 'accent', cerrado: 'neutral' } as const

export default function YearsPage() {
  const years = useAsync(() => academicService.years(), [])
  const can = useCan()
  const [cfg, setCfg] = useState<AcademicYear | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [newYear, setNewYear] = useState('')
  const [act, setAct] = useState<AcademicYear | null>(null)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<EconomicConfig>()

  const open = (y: AcademicYear) => { setCfg(y); reset(y.config) }
  const save = handleSubmit(async (v) => {
    try {
      await academicService.updateYearConfig(cfg!.id, { matriculaAmount: Number(v.matriculaAmount), mensualidadAmount: Number(v.mensualidadAmount), installments: Number(v.installments), startMonth: Number(v.startMonth), dueDay: Number(v.dueDay), matriculaDueDate: v.matriculaDueDate })
      notify.success('Configuración económica actualizada', 'Se aplicará a las nuevas matrículas.'); setCfg(null)
    } catch (e) { notify.error(e) }
  })

  return (
    <>
      <PageHeader eyebrow="Gestión académica" title="Años académicos" description="Ciclos lectivos y configuración económica que se aplica a cada nueva matrícula."
        actions={<Button icon={<CalendarPlus />} disabled={!can('academic.write')} onClick={() => setNewOpen(true)}>Nuevo año académico</Button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        {!years.data ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-[14px]" />) : years.data.map((y, i) => (
          <motion.div key={y.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className={y.status === 'activo' ? 'h-full ring-2 ring-primary/30' : 'h-full'}>
              <CardHeader title={<span className="text-2xl tracking-tight">{y.year}</span>} description={`${fmtDate(y.startDate)} → ${fmtDate(y.endDate)}`} action={<Badge tone={tone[y.status]}>{y.status === 'activo' ? 'Activo' : y.status === 'planificado' ? 'Planificado' : 'Cerrado'}</Badge>} />
              <dl className="grid grid-cols-2 gap-4 px-5 pb-4 text-[13px]">
                {[['Matrícula', money(y.config.matriculaAmount)], ['Mensualidad', money(y.config.mensualidadAmount)], ['Cuotas', `${y.config.installments} mensualidades`], ['Inicio', `${MONTH_NAMES[y.config.startMonth - 1]}, día ${y.config.dueDay}`]].map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-semibold tabular">{v}</dd></div>)}
              </dl>
              <div className="flex flex-wrap gap-2 border-t border-line px-5 py-3.5">
                <Button size="sm" variant="secondary" icon={<Settings2 />} disabled={!can('academic.write')} onClick={() => open(y)}>Configurar</Button>
                {y.status !== 'activo' && <Button size="sm" variant="subtle" icon={<CheckCircle2 />} disabled={!can('academic.write')} onClick={() => setAct(y)}>Activar</Button>}
                {y.status === 'activo' && <Button size="sm" variant="ghost" icon={<CalendarCheck2 />} disabled={!can('academic.write')} onClick={async () => { try { await academicService.setYearStatus(y.id, 'cerrado'); notify.success(`Año ${y.year} cerrado`) } catch (e) { notify.error(e) } }}>Cerrar año</Button>}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Modal open={!!cfg} onOpenChange={(o) => !o && setCfg(null)} title={`Configuración económica ${cfg?.year}`} description="Los importes son configurables y se aplican solo a nuevas matrículas; las existentes conservan sus condiciones." size="md"
        footer={<><Button variant="ghost" onClick={() => setCfg(null)}>Cancelar</Button><Button loading={isSubmitting} onClick={save}>Guardar configuración</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Precio de matrícula (S/)" type="number" step="0.01" {...register('matriculaAmount')} />
          <Input label="Importe de mensualidad (S/)" type="number" step="0.01" {...register('mensualidadAmount')} />
          <Input label="Número de mensualidades" type="number" min={1} max={12} {...register('installments')} />
          <Select label="Mes de inicio" options={MONTH_NAMES.map((m, i) => ({ value: String(i + 1), label: m }))} {...register('startMonth')} />
          <Input label="Día de vencimiento" type="number" min={1} max={28} {...register('dueDay')} />
          <Input label="Vencimiento de matrícula" type="date" {...register('matriculaDueDate')} />
        </div>
      </Modal>
      <Modal open={newOpen} onOpenChange={setNewOpen} title="Nuevo año académico" description="Se copiará la configuración económica del año más reciente y se crearán secciones A y B por grado." size="sm"
        footer={<><Button variant="ghost" onClick={() => setNewOpen(false)}>Cancelar</Button><Button onClick={async () => { try { await academicService.createYear(Number(newYear)); notify.success(`Año ${newYear} creado`); setNewOpen(false); setNewYear('') } catch (e) { notify.error(e) } }}>Crear año</Button></>}>
        <Input label="Año" type="number" value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="2028" />
      </Modal>
      <ConfirmDialog open={!!act} onOpenChange={(o) => !o && setAct(null)} title={`Activar año ${act?.year}`} description="Solo un año puede estar activo. El año activo actual pasará a estado cerrado." confirmLabel="Activar"
        onConfirm={async () => { try { await academicService.setYearStatus(act!.id, 'activo'); notify.success(`Año ${act!.year} activado`) } catch (e) { notify.error(e); throw e } }} />
    </>
  )
}
