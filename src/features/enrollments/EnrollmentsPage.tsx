import type { ColumnDef } from '@tanstack/react-table'
import { Download, Eye, FileBadge2, MoreHorizontal, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { EnrollmentBadge } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { SearchInput, Select } from '@/components/ui/Field'
import { FilterPanel } from '@/components/shared/FilterPanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAsync } from '@/hooks/useAsync'
import { useCan } from '@/hooks/usePermission'
import { useDebounced } from '@/hooks/useDebounced'
import { academicService } from '@/services/academicService'
import { enrollmentService } from '@/services/enrollmentService'
import { ENROLLMENT_STATUS_LABEL } from '@/constants'
import { downloadCsv } from '@/utils/export'
import { fmtDate, money } from '@/utils/format'
import { notify } from '@/utils/toast'
import type { EnrollmentRow, EnrollmentStatus } from '@/types'
import { printConstancia } from './constancia'

export default function EnrollmentsPage() {
  const navigate = useNavigate()
  const can = useCan()
  const [sp] = useSearchParams()
  const [q, setQ] = useState('')
  const [yearId, setYearId] = useState('')
  const [levelId, setLevelId] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [status, setStatus] = useState<EnrollmentStatus | ''>((sp.get('estado') as EnrollmentStatus) || '')
  const dq = useDebounced(q)
  const years = useAsync(() => academicService.years(), [])
  const grades = useAsync(() => academicService.grades(), [])
  const list = useAsync(() => enrollmentService.list({ q: dq, yearId, levelId, gradeId, status }), [dq, yearId, levelId, gradeId, status])
  const rows = useMemo(() => (list.data ?? []).filter((r) => !sectionName || r.sectionName === sectionName), [list.data, sectionName])
  const active = !!(q || yearId || levelId || gradeId || sectionName || status)

  const columns = useMemo<ColumnDef<EnrollmentRow, unknown>[]>(() => [
    { accessorKey: 'code', header: 'Matrícula', cell: (c) => <Link to={`/academico/matriculas/${c.row.original.id}`} className="font-mono text-xs font-medium text-primary hover:underline">{c.getValue() as string}</Link> },
    { id: 'st', accessorFn: (r) => r.studentName, header: 'Estudiante', cell: ({ row: { original: r } }) => <div className="flex items-center gap-3"><Avatar name={r.studentName} size="sm" /><div><p className="font-medium">{r.studentName}</p><p className="text-xs text-muted">DNI {r.studentDni}</p></div></div> },
    { accessorKey: 'year', header: 'Año' },
    { id: 'gr', accessorFn: (r) => r.gradeName, header: 'Grado', cell: ({ row: { original: r } }) => r.gradeName },
    { accessorKey: 'sectionName', header: 'Sec.' },
    { accessorKey: 'enrolledAt', header: 'Fecha', cell: (c) => fmtDate(c.getValue() as string) },
    { accessorKey: 'status', header: 'Estado', cell: ({ row: { original: r } }) => <EnrollmentBadge status={r.status} /> },
    { accessorKey: 'balance', header: 'Saldo', meta: { align: 'right' }, cell: (c) => <span className={(c.getValue() as number) > 0 ? 'font-medium' : 'text-muted'}>{money(c.getValue() as number)}</span> },
    { id: 'a', header: '', enableSorting: false, cell: ({ row: { original: r } }) => (
      <div onClick={(e) => e.stopPropagation()} className="flex justify-end"><Dropdown trigger={<IconButton label="Acciones"><MoreHorizontal /></IconButton>} items={[
        { label: 'Ver detalle', icon: <Eye />, onSelect: () => navigate(`/academico/matriculas/${r.id}`) },
        { label: 'Generar constancia', icon: <FileBadge2 />, disabled: r.status === 'anulado', onSelect: () => { printConstancia(r.id); notify.success('Constancia generada') } },
      ]} /></div>) },
  ], [navigate])

  return (
    <>
      <PageHeader eyebrow="Gestión académica" title="Matrículas" description="Cada matrícula es una inscripción independiente por año académico."
        actions={<><Button variant="secondary" icon={<Download />} disabled={!rows.length} onClick={() => { downloadCsv('matriculas-iep-alfa', ['Código', 'Estudiante', 'DNI', 'Año', 'Grado', 'Sección', 'Estado', 'Saldo'], rows.map((r) => [r.code, r.studentName, r.studentDni, r.year, r.gradeName, r.sectionName, r.status, r.balance])); notify.success('Exportación generada') }}>Exportar CSV</Button>
          <Button icon={<Plus />} disabled={!can('enrollments.write')} onClick={() => navigate('/academico/matriculas/nueva')}>Nueva matrícula</Button></>} />
      <DataTable data={list.data ? rows : undefined} loading={list.loading} error={list.error} onRetry={list.reload} columns={columns} resetKey={`${dq}${yearId}${levelId}${gradeId}${sectionName}${status}`}
        onRowClick={(r) => navigate(`/academico/matriculas/${r.id}`)} empty={{ title: 'Sin matrículas', description: 'No hay matrículas que coincidan con los filtros.' }}
        toolbar={<FilterPanel active={active} onClear={() => { setQ(''); setYearId(''); setLevelId(''); setGradeId(''); setSectionName(''); setStatus('') }}>
          <SearchInput value={q} onChange={setQ} placeholder="Estudiante, DNI o código…" className="w-full sm:w-64" />
          <Select aria-label="Año" value={yearId} onChange={(e) => setYearId(e.target.value)} placeholder="Todos los años" options={years.data?.map((y) => ({ value: y.id, label: String(y.year) })) ?? []} className="w-36" />
          <Select aria-label="Nivel" value={levelId} onChange={(e) => { setLevelId(e.target.value); setGradeId('') }} placeholder="Nivel" options={[{ value: 'primaria', label: 'Primaria' }, { value: 'secundaria', label: 'Secundaria' }]} className="w-36" />
          <Select aria-label="Grado" value={gradeId} onChange={(e) => setGradeId(e.target.value)} placeholder="Grado" options={grades.data?.filter((g) => !levelId || g.levelId === levelId).map((g) => ({ value: g.id, label: g.name })) ?? []} className="w-48" />
          <Select aria-label="Sección" value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="Sección" options={['A', 'B'].map((s) => ({ value: s, label: s }))} className="w-28" />
          <Select aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value as EnrollmentStatus | '')} placeholder="Estado" options={Object.entries(ENROLLMENT_STATUS_LABEL).map(([value, label]) => ({ value, label }))} className="w-40" />
        </FilterPanel>} />
    </>
  )
}
