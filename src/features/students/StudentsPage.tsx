import type { ColumnDef } from '@tanstack/react-table'
import { Download, Eye, GraduationCap, MoreHorizontal, Pencil, Plus, ShieldAlert, UserCheck, UserMinus, UserX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { StudentBadge, Badge } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Confirm'
import { DataTable } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { SearchInput, Select } from '@/components/ui/Field'
import { Drawer } from '@/components/ui/Modal'
import { FilterPanel } from '@/components/shared/FilterPanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAsync } from '@/hooks/useAsync'
import { useCan } from '@/hooks/usePermission'
import { useDebounced } from '@/hooks/useDebounced'
import { academicService } from '@/services/academicService'
import { studentService } from '@/services/studentService'
import { useUi } from '@/stores/uiStore'
import { downloadCsv } from '@/utils/export'
import { notify } from '@/utils/toast'
import type { StudentRow, StudentStatus } from '@/types'
import { StudentForm } from './StudentForm'

export default function StudentsPage() {
  const navigate = useNavigate()
  const can = useCan()
  const yearId = useUi((s) => s.yearId)
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState('')
  const [levelId, setLevelId] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [status, setStatus] = useState<StudentStatus | ''>('')
  const dq = useDebounced(q)
  const formOpen = sp.get('nuevo') === '1'
  const [editing, setEditing] = useState<string | null>(null)
  const [target, setTarget] = useState<{ s: StudentRow; to: StudentStatus } | null>(null)
  const [deleting, setDeleting] = useState<StudentRow | null>(null)

  const grades = useAsync(() => academicService.grades(), [])
  const list = useAsync(() => studentService.list({ q: dq, levelId, gradeId, sectionName, status, yearId }), [dq, levelId, gradeId, sectionName, status, yearId])
  const edit = useAsync(() => (editing ? studentService.get(editing) : Promise.resolve(null)), [editing])
  const active = !!(q || levelId || gradeId || sectionName || status)

  const columns = useMemo<ColumnDef<StudentRow, unknown>[]>(() => [
    { accessorKey: 'code', header: 'Código', cell: (c) => <span className="font-mono text-xs text-muted">{c.getValue() as string}</span> },
    { id: 'student', accessorFn: (r) => r.fullName, header: 'Estudiante', cell: ({ row: { original: s } }) => (
      <Link to={`/academico/estudiantes/${s.id}`} className="group flex items-center gap-3"><Avatar name={s.fullName} src={s.photo} />
        <div className="min-w-0"><p className="truncate font-medium text-ink group-hover:text-primary">{s.fullName}</p><p className="text-xs text-muted">DNI {s.dni}</p></div></Link>) },
    { id: 'level', accessorFn: (r) => r.levelId ?? '', header: 'Nivel', cell: ({ row: { original: s } }) => s.levelId ? <span className="capitalize">{s.levelId}</span> : <span className="text-muted">—</span> },
    { id: 'grade', accessorFn: (r) => r.gradeName ?? '', header: 'Grado', cell: ({ row: { original: s } }) => s.gradeName ?? <Badge tone="neutral" dot={false}>Sin matrícula</Badge> },
    { accessorKey: 'sectionName', header: 'Sec.', cell: (c) => (c.getValue() as string | null) ?? '—' },
    { id: 'guardian', accessorFn: (r) => r.guardianName, header: 'Apoderado', cell: ({ row: { original: s } }) => <div className="min-w-0"><p className="truncate">{s.guardianName}</p><p className="text-xs text-muted">{s.guardianPhone}</p></div> },
    { accessorKey: 'status', header: 'Estado', cell: ({ row: { original: s } }) => <StudentBadge status={s.status} /> },
    { id: 'debt', accessorFn: (r) => r.debt, header: 'Deuda', meta: { align: 'right' }, cell: ({ row: { original: s } }) => s.debt > 0 ? <span className="font-medium text-danger">S/ {s.debt.toFixed(2)}</span> : <span className="text-muted">—</span> },
    { id: 'actions', header: '', enableSorting: false, cell: ({ row: { original: s } }) => (
      <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
        <Dropdown trigger={<IconButton label={`Acciones de ${s.fullName}`}><MoreHorizontal /></IconButton>} items={[
          { label: 'Ver perfil', icon: <Eye />, onSelect: () => navigate(`/academico/estudiantes/${s.id}`) },
          { label: 'Editar', icon: <Pencil />, onSelect: () => setEditing(s.id), disabled: !can('students.write') },
          { label: 'Matricular', icon: <GraduationCap />, onSelect: () => navigate(`/academico/matriculas/nueva?estudiante=${s.id}`), disabled: !can('enrollments.write') },
          ...(s.status !== 'activo' ? [{ label: 'Reactivar', icon: <UserCheck />, onSelect: () => setTarget({ s, to: 'activo' as const }), disabled: !can('students.write'), separatorBefore: true }] : []),
          ...(s.status === 'activo' ? [{ label: 'Marcar inactivo', icon: <UserMinus />, onSelect: () => setTarget({ s, to: 'inactivo' as const }), disabled: !can('students.write'), separatorBefore: true }] : []),
          ...(s.status !== 'retirado' ? [{ label: 'Marcar retirado', icon: <UserX />, onSelect: () => setTarget({ s, to: 'retirado' as const }), disabled: !can('students.write') }] : []),
          { label: 'Eliminar…', icon: <ShieldAlert />, danger: true, onSelect: () => setDeleting(s), disabled: !can('students.write') },
        ]} />
      </div>) },
  ], [navigate, can])

  const exportCsv = () => {
    const rows = list.data ?? []
    downloadCsv('estudiantes-iep-alfa', ['Código', 'DNI', 'Estudiante', 'Nivel', 'Grado', 'Sección', 'Apoderado', 'Teléfono', 'Estado'], rows.map((r) => [r.code, r.dni, r.fullName, r.levelId ?? '', r.gradeName ?? '', r.sectionName ?? '', r.guardianName, r.guardianPhone, r.status]))
    notify.success('Exportación generada', `${rows.length} registros en CSV`)
  }
  const closeForm = () => { setEditing(null); if (formOpen) { sp.delete('nuevo'); setSp(sp, { replace: true }) } }
  const sectionOptions = ['A', 'B'].map((s) => ({ value: s, label: `Sección ${s}` }))

  return (
    <>
      <PageHeader eyebrow="Gestión académica" title="Estudiantes" description="Registro único de estudiantes: datos personales, apoderados e historial."
        actions={<><Button variant="secondary" icon={<Download />} onClick={exportCsv} disabled={!list.data?.length}>Exportar CSV</Button>
          <Button icon={<Plus />} disabled={!can('students.write')} onClick={() => { sp.set('nuevo', '1'); setSp(sp) }}>Nuevo estudiante</Button></>} />
      <DataTable data={list.data} loading={list.loading} error={list.error} onRetry={list.reload} columns={columns} resetKey={`${dq}${levelId}${gradeId}${sectionName}${status}${yearId}`}
        onRowClick={(s) => navigate(`/academico/estudiantes/${s.id}`)}
        empty={{ title: 'No se encontraron estudiantes', description: 'Pruebe con otro nombre, DNI o limpie los filtros.' }}
        toolbar={<FilterPanel active={active} onClear={() => { setQ(''); setLevelId(''); setGradeId(''); setSectionName(''); setStatus('') }}>
          <SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre, DNI o código…" className="w-full sm:w-72" />
          <Select aria-label="Nivel" value={levelId} onChange={(e) => { setLevelId(e.target.value); setGradeId('') }} placeholder="Todos los niveles" options={[{ value: 'primaria', label: 'Primaria' }, { value: 'secundaria', label: 'Secundaria' }]} className="w-44" />
          <Select aria-label="Grado" value={gradeId} onChange={(e) => setGradeId(e.target.value)} placeholder="Todos los grados" options={grades.data?.filter((g) => !levelId || g.levelId === levelId).map((g) => ({ value: g.id, label: g.name })) ?? []} className="w-52" />
          <Select aria-label="Sección" value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="Sección" options={sectionOptions} className="w-36" />
          <Select aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value as StudentStatus | '')} placeholder="Todos los estados" options={[{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }, { value: 'retirado', label: 'Retirado' }]} className="w-44" />
        </FilterPanel>} />

      <Drawer open={formOpen || !!editing} onOpenChange={(o) => !o && closeForm()} width="max-w-3xl" title={editing ? 'Editar estudiante' : 'Registrar estudiante'}
        description="Complete los datos del estudiante y su apoderado principal."
        footer={<><Button variant="ghost" onClick={closeForm}>Cancelar</Button><Button type="submit" form="student-form">{editing ? 'Guardar cambios' : 'Registrar estudiante'}</Button></>}>
        {editing && !edit.data ? <p className="text-sm text-muted">Cargando datos…</p> : (
          <StudentForm key={editing ?? 'new'} editingId={editing ?? undefined} hideActions onSaved={(id) => { closeForm(); if (!editing) navigate(`/academico/estudiantes/${id}`) }}
            initial={editing && edit.data ? { dni: edit.data.raw.dni, names: edit.data.raw.names, paternalSurname: edit.data.raw.paternalSurname, maternalSurname: edit.data.raw.maternalSurname, birthDate: edit.data.raw.birthDate, sex: edit.data.raw.sex, address: edit.data.raw.address, phone: edit.data.raw.phone, email: edit.data.raw.email, photo: edit.data.raw.photo, notes: edit.data.raw.notes, guardian: { dni: edit.data.guardian.dni, names: edit.data.guardian.names, surnames: edit.data.guardian.surnames, relationship: edit.data.guardian.relationship, phone: edit.data.guardian.phone, email: edit.data.guardian.email, address: edit.data.guardian.address } } : undefined} />
        )}
      </Drawer>

      <ConfirmDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)} tone={target?.to === 'activo' ? 'primary' : 'danger'}
        title={target?.to === 'activo' ? 'Reactivar estudiante' : target?.to === 'retirado' ? 'Marcar como retirado' : 'Marcar como inactivo'}
        description={<>El estado de <b>{target?.s.fullName}</b> cambiará a <b>{target?.to}</b>. El historial académico y económico se conserva.</>} confirmLabel="Confirmar"
        onConfirm={async () => { try { await studentService.setStatus(target!.s.id, target!.to); notify.success('Estado actualizado') } catch (e) { notify.error(e); throw e } }} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} tone="danger" title="Eliminar estudiante" confirmLabel="Intentar eliminar"
        description={<>Se intentará eliminar a <b>{deleting?.fullName}</b>. Los estudiantes con historial no pueden eliminarse físicamente.</>}
        onConfirm={async () => { try { await studentService.remove(deleting!.id) } catch (e) { notify.error(e); throw e } }} />
    </>
  )
}
