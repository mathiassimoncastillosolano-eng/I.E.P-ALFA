import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileBadge2, Search, UserPlus, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, StudentBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { SearchInput } from '@/components/ui/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAsync } from '@/hooks/useAsync'
import { useDebounced } from '@/hooks/useDebounced'
import { useCan } from '@/hooks/usePermission'
import { academicService } from '@/services/academicService'
import { enrollmentService } from '@/services/enrollmentService'
import { studentService } from '@/services/studentService'
import { StudentForm } from '@/features/students/StudentForm'
import { economicSchema } from '@/schemas'
import { MONTH_NAMES } from '@/constants'
import { fmtDate, money } from '@/utils/format'
import { notify } from '@/utils/toast'
import { cx } from '@/utils/cn'
import type { EnrollmentRow, StudentRow } from '@/types'
import { printConstancia } from './constancia'

const STEPS = ['Estudiante', 'Información académica', 'Información económica', 'Confirmación']

export default function EnrollmentWizardPage() {
  const navigate = useNavigate()
  const can = useCan()
  const [sp] = useSearchParams()
  const [step, setStep] = useState(0)
  const [student, setStudent] = useState<StudentRow | null>(null)
  const [mode, setMode] = useState<'search' | 'new'>('search')
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const [results, setResults] = useState<StudentRow[]>([])
  const [yearId, setYearId] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [eco, setEco] = useState({ matriculaAmount: 0, mensualidadAmount: 0, installments: 10, discountPct: 0, conditions: '' })
  const [ecoErr, setEcoErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<EnrollmentRow | null>(null)

  const years = useAsync(() => academicService.years(), [])
  const grades = useAsync(() => academicService.grades(), [])
  const sections = useAsync(() => (yearId ? academicService.sections(yearId) : Promise.resolve([])), [yearId])
  const year = years.data?.find((y) => y.id === yearId)

  useEffect(() => { if (years.data && !yearId) { const y = years.data.find((x) => x.status === 'activo') ?? years.data[0]; setYearId(y.id) } }, [years.data, yearId])
  useEffect(() => { if (year) setEco((e) => ({ ...e, matriculaAmount: year.config.matriculaAmount, mensualidadAmount: year.config.mensualidadAmount, installments: year.config.installments })) }, [year])
  useEffect(() => {
    const id = sp.get('estudiante')
    if (id) studentService.get(id).then((r) => { setStudent(r.student); setStep(1) }).catch(() => undefined)
  }, [sp])
  useEffect(() => {
    if (!dq.trim()) { setResults([]); return }
    let live = true
    studentService.search(dq).then((r) => live && setResults(r))
    return () => { live = false }
  }, [dq])

  const duplicate = student && yearId ? enrollmentService.findDuplicate(student.id, yearId) : undefined
  const secOptions = useMemo(() => sections.data?.filter((s) => s.gradeId === gradeId) ?? [], [sections.data, gradeId])
  const section = secOptions.find((s) => s.id === sectionId)
  const grade = grades.data?.find((g) => g.id === gradeId)
  const mensual = Math.round(eco.mensualidadAmount * (1 - eco.discountPct / 100) * 100) / 100
  const total = eco.matriculaAmount + mensual * eco.installments

  const next = () => {
    if (step === 0 && !student) return notify.error(new Error('Seleccione o registre un estudiante'))
    if (step === 0 && student?.status === 'retirado') return notify.error(new Error('Reactive al estudiante antes de matricularlo'))
    if (step === 0 && duplicate) return notify.error(new Error('El estudiante ya tiene matrícula en el año seleccionado'))
    if (step === 1) {
      if (!gradeId || !sectionId) return notify.error(new Error('Seleccione grado y sección'))
      if (duplicate) return notify.error(new Error(`Ya existe la matrícula ${duplicate.code} en este año`))
      if (!section || section.vacancies <= 0) return notify.error(new Error('La sección no tiene vacantes'))
    }
    if (step === 2) {
      const r = economicSchema.safeParse(eco)
      if (!r.success) { setEcoErr(r.error.issues[0].message); return }
      setEcoErr('')
    }
    setStep((s) => s + 1)
  }

  const confirm = async (status: 'pendiente' | 'matriculado') => {
    setBusy(true)
    try {
      const r = await enrollmentService.create({ studentId: student!.id, yearId, gradeId, sectionId, ...eco, status })
      setDone(r); notify.success('Matrícula registrada', `${r.code} · ${r.studentName}`)
    } catch (e) { notify.error(e) } finally { setBusy(false) }
  }

  if (!can('enrollments.write')) return <Card className="p-10 text-center text-sm text-muted">Su rol no tiene permiso para registrar matrículas.</Card>

  if (done) return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-lg py-10 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-success-soft text-success"><CheckCircle2 className="size-10" /></motion.div>
      <h1 className="text-2xl font-semibold">Matrícula registrada</h1>
      <p className="mt-2 text-sm text-muted">{done.studentName} · {done.gradeName} {done.sectionName} · {done.year}<br />Código <b className="font-mono text-ink">{done.code}</b> · {done.status === 'pendiente' ? 'se generó la obligación de matrícula; las mensualidades se generan al confirmar el pago.' : 'se generaron matrícula y mensualidades.'}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button icon={<FileBadge2 />} variant="secondary" onClick={() => printConstancia(done.id)}>Generar constancia</Button>
        <Link to={`/academico/matriculas/${done.id}`}><Button>Ver matrícula</Button></Link>
        <Link to={`/economico/pagos?nuevo=1&matricula=${done.id}`}><Button variant="subtle">Registrar pago</Button></Link>
      </div>
    </motion.div>
  )

  return (
    <>
      <PageHeader eyebrow="Matrículas" title="Nueva matrícula" description="Asistente de cuatro pasos. Los datos del estudiante existente no se vuelven a solicitar." />
      <ol className="mb-6 flex items-center gap-2 overflow-x-auto pb-1" aria-label="Progreso">
        {STEPS.map((s, i) => (
          <li key={s} className="flex shrink-0 items-center gap-2" aria-current={i === step ? 'step' : undefined}>
            <span className={cx('flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors', i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-primary-fg ring-4 ring-primary/20' : 'bg-surface-3 text-muted')}>{i < step ? <Check className="size-4" /> : i + 1}</span>
            <span className={cx('hidden text-[13px] font-medium sm:block', i === step ? 'text-ink' : 'text-muted')}>{s}</span>
            {i < STEPS.length - 1 && <span className={cx('mx-1 h-px w-8 sm:w-12', i < step ? 'bg-success' : 'bg-line-strong')} />}
          </li>
        ))}
      </ol>

      <Card className="p-5 sm:p-7">
        <AnimatePresence mode="wait">
          <motion.div key={step + mode} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
            {step === 0 && (mode === 'new' ? (
              <div><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Registrar nuevo estudiante</h2><Button variant="ghost" size="sm" onClick={() => setMode('search')}>← Buscar existente</Button></div>
                <StudentForm formId="wiz-student" onSaved={async (id) => { const r = await studentService.get(id); setStudent(r.student); setMode('search'); notify.info('Estudiante seleccionado para la matrícula') }} /></div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Seleccione al estudiante</h2><Button variant="secondary" icon={<UserPlus />} onClick={() => setMode('new')}>Registrar nuevo</Button></div>
                <SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre, DNI o código…" />
                {!student && results.length > 0 && <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">{results.map((r) => (
                  <li key={r.id}><button onClick={() => { setStudent(r); setQ('') }} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary-soft/40"><Avatar name={r.fullName} size="sm" /><div className="flex-1"><p className="text-sm font-medium">{r.fullName}</p><p className="text-xs text-muted">DNI {r.dni} · {r.gradeName ?? 'Sin matrícula vigente'}</p></div><StudentBadge status={r.status} /></button></li>))}</ul>}
                {!student && q && !results.length && <p className="flex items-center gap-2 text-sm text-muted"><Search className="size-4" />Sin resultados. Puede registrar un nuevo estudiante.</p>}
                {student && (
                  <div className="flex flex-wrap items-center gap-4 rounded-xl border border-primary/30 bg-primary-soft/40 p-4"><Avatar name={student.fullName} size="lg" />
                    <div className="min-w-0 flex-1"><p className="font-semibold">{student.fullName}</p><p className="text-sm text-muted">DNI {student.dni} · {student.code} · Apoderado: {student.guardianName}</p></div>
                    <StudentBadge status={student.status} /><Button variant="ghost" size="sm" onClick={() => setStudent(null)}>Cambiar</Button></div>)}
                {duplicate && <p className="flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-sm text-warning"><TriangleAlert className="mt-0.5 size-4 shrink-0" />Ya tiene la matrícula {duplicate.code} en el año {year?.year}. Cambie el año en el siguiente paso.</p>}
              </div>
            ))}

            {step === 1 && (
              <div className="space-y-5"><h2 className="text-lg font-semibold">Información académica</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Select label="Año académico" value={yearId} onChange={(e) => { setYearId(e.target.value); setSectionId('') }} options={years.data?.filter((y) => y.status !== 'cerrado').map((y) => ({ value: y.id, label: `${y.year}${y.status === 'activo' ? ' · activo' : ''}` })) ?? []} />
                  <Select label="Nivel" value={grade?.levelId ?? ''} onChange={(e) => { setGradeId(''); setSectionId(''); const lv = e.target.value; const first = grades.data?.find((g) => g.levelId === lv); if (first) setGradeId(first.id) }} placeholder="Seleccione" options={[{ value: 'primaria', label: 'Primaria' }, { value: 'secundaria', label: 'Secundaria' }]} />
                  <Select label="Grado" value={gradeId} onChange={(e) => { setGradeId(e.target.value); setSectionId('') }} placeholder="Seleccione" options={grades.data?.filter((g) => !grade || g.levelId === grade.levelId).map((g) => ({ value: g.id, label: g.name })) ?? []} />
                  <Select label="Sección" value={sectionId} onChange={(e) => setSectionId(e.target.value)} placeholder="Seleccione" options={secOptions.map((s) => ({ value: s.id, label: `Sección ${s.name} · ${s.vacancies} vacantes`, disabled: s.vacancies <= 0 || s.status !== 'abierta' }))} />
                </div>
                {section && <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-4 text-sm">
                  <div className="flex-1"><p className="font-medium">{grade?.name} · Sección {section.name}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-primary" style={{ width: `${(section.enrolled / section.capacity) * 100}%` }} /></div></div>
                  <Badge tone={section.vacancies > 0 ? 'success' : 'danger'}>{section.vacancies} vacantes de {section.capacity}</Badge></div>}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5"><h2 className="text-lg font-semibold">Información económica</h2>
                <p className="text-sm text-muted">Valores prellenados desde la configuración del año {year?.year}; puede ajustarlos para esta matrícula.</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Input label="Matrícula (S/)" type="number" step="0.01" value={eco.matriculaAmount} onChange={(e) => setEco({ ...eco, matriculaAmount: Number(e.target.value) })} />
                  <Input label="Mensualidad (S/)" type="number" step="0.01" value={eco.mensualidadAmount} onChange={(e) => setEco({ ...eco, mensualidadAmount: Number(e.target.value) })} />
                  <Input label="Número de cuotas" type="number" min={1} max={12} value={eco.installments} onChange={(e) => setEco({ ...eco, installments: Number(e.target.value) })} />
                  <Input label="Descuento en mensualidad (%)" type="number" min={0} max={100} value={eco.discountPct} onChange={(e) => setEco({ ...eco, discountPct: Number(e.target.value) })} />
                </div>
                {ecoErr && <p className="text-sm text-danger" role="alert">{ecoErr}</p>}
                <Textarea label="Condiciones económicas" value={eco.conditions} maxLength={300} onChange={(e) => setEco({ ...eco, conditions: e.target.value })} placeholder="Ej.: descuento por hermanos, exoneración parcial…" />
                <div className="grid gap-3 rounded-xl bg-surface-2 p-4 text-sm sm:grid-cols-3">
                  <div><p className="text-xs text-muted">Primer vencimiento</p><p className="font-semibold">{year ? `${fmtDate(year.config.matriculaDueDate)} (matrícula)` : '—'}</p></div>
                  <div><p className="text-xs text-muted">Mensualidades</p><p className="font-semibold">{year ? `${MONTH_NAMES[year.config.startMonth - 1]} · día ${year.config.dueDay}` : '—'}</p></div>
                  <div><p className="text-xs text-muted">Cuota neta</p><p className="font-semibold">{money(mensual)}</p></div></div>
              </div>
            )}

            {step === 3 && student && (
              <div className="space-y-5"><h2 className="text-lg font-semibold">Confirmación</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {[{ t: 'Estudiante', l: [student.fullName, `DNI ${student.dni}`, student.guardianName] }, { t: 'Académico', l: [`Año ${year?.year}`, grade?.name ?? '', `Sección ${section?.name}`] }, { t: 'Económico', l: [`Matrícula ${money(eco.matriculaAmount)}`, `${eco.installments} × ${money(mensual)}`, `Total ${money(total)}`] }].map((b) => (
                    <div key={b.t} className="rounded-xl border border-line p-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{b.t}</p>{b.l.map((x, i) => <p key={i} className={i === 0 ? 'font-semibold' : 'text-sm text-muted'}>{x}</p>)}</div>))}
                </div>
                <p className="rounded-xl bg-primary-soft/50 p-4 text-sm text-ink-2">Elija <b>Matricular y generar cuotas</b> si la matrícula queda confirmada (se generan matrícula y {eco.installments} mensualidades), o <b>Dejar pendiente</b> para completarla cuando se pague la matrícula.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {!(step === 0 && mode === 'new') && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
            <Button variant="ghost" icon={<ArrowLeft />} onClick={() => (step === 0 ? navigate('/academico/matriculas') : setStep(step - 1))}>{step === 0 ? 'Cancelar' : 'Atrás'}</Button>
            {step < 3 ? <Button iconRight={<ArrowRight />} onClick={next}>Continuar</Button> : (
              <div className="flex flex-wrap gap-2"><Button variant="secondary" loading={busy} onClick={() => confirm('pendiente')}>Dejar pendiente</Button><Button loading={busy} icon={<Check />} onClick={() => confirm('matriculado')}>Matricular y generar cuotas</Button></div>)}
          </div>
        )}
      </Card>
    </>
  )
}
