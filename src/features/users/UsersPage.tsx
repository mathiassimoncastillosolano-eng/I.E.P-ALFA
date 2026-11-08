import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Minus, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAsync } from '@/hooks/useAsync'
import { useCan, useCurrentUser } from '@/hooks/usePermission'
import { userService } from '@/services/userService'
import { userSchema, type UserFormValues } from '@/schemas'
import { ROLE_LABEL, ROLE_PERMISSIONS } from '@/constants'
import { fmtDateTime } from '@/utils/format'
import { notify } from '@/utils/toast'
import type { Permission, RoleId } from '@/types'

const PERM_LABEL: Record<Permission, string> = {
  'students.write': 'Registrar y editar estudiantes', 'enrollments.write': 'Registrar y editar matrículas', 'enrollments.cancel': 'Retirar / anular matrículas',
  'payments.write': 'Registrar pagos', 'payments.void': 'Anular pagos', 'academic.write': 'Administrar estructura y años', 'settings.write': 'Configuración institucional',
  'users.write': 'Administrar usuarios', 'audit.read': 'Ver auditoría', 'reports.read': 'Ver reportes', 'finance.read': 'Ver información financiera',
}
const ROLES = Object.keys(ROLE_LABEL) as RoleId[]

export default function UsersPage() {
  const users = useAsync(() => userService.list(), [])
  const can = useCan()
  const me = useCurrentUser()
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues: { name: '', email: '', role: 'secretaria' } })
  const create = handleSubmit(async (v) => { try { await userService.create(v); notify.success('Usuario creado'); reset(); setOpen(false) } catch (e) { notify.error(e) } })
  const canEdit = can('users.write')

  return (
    <>
      <PageHeader eyebrow="Administración" title="Usuarios y roles" description="Control de acceso simulado en el frontend. No existe autenticación real."
        actions={<Button icon={<UserPlus />} disabled={!canEdit} onClick={() => setOpen(true)}>Nuevo usuario</Button>} />
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="overflow-hidden xl:col-span-2"><CardHeader title="Usuarios" description={`Sesión actual: ${me.name}`} />
          {!users.data ? <div className="space-y-2 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div> : (
            <ul className="divide-y divide-line">{users.data.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3.5"><Avatar name={u.name} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{u.name}{u.id === me.id && <Badge tone="primary" className="ml-2" dot={false}>Tú</Badge>}</p><p className="truncate text-xs text-muted">{u.email} · {u.lastAccess === '—' ? 'Sin acceso' : fmtDateTime(u.lastAccess)}</p></div>
                <Select aria-label={`Rol de ${u.name}`} size="sm" className="w-40" disabled={!canEdit || u.id === me.id} value={u.role} onChange={async (e) => { try { await userService.update(u.id, { role: e.target.value as RoleId }); notify.success('Rol actualizado') } catch (er) { notify.error(er) } }} options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />
                <button disabled={!canEdit || u.id === me.id} onClick={async () => { try { await userService.update(u.id, { active: !u.active }); notify.success(u.active ? 'Usuario desactivado' : 'Usuario activado') } catch (er) { notify.error(er) } }} className="disabled:opacity-40" aria-label={u.active ? 'Desactivar' : 'Activar'}><Badge tone={u.active ? 'success' : 'neutral'}>{u.active ? 'Activo' : 'Inactivo'}</Badge></button></li>))}</ul>)}
        </Card>
        <Card className="overflow-hidden xl:col-span-3"><CardHeader title="Matriz de permisos" description="Se aplica en botones, rutas y acciones de la interfaz." />
          <div className="overflow-x-auto"><table className="w-full min-w-max text-[13px]"><thead className="bg-surface-2 text-[11.5px] uppercase tracking-wider text-muted"><tr><th className="px-5 py-3 text-left font-semibold">Permiso</th>{ROLES.map((r) => <th key={r} className="px-3 py-3 text-center font-semibold">{ROLE_LABEL[r]}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{(Object.keys(PERM_LABEL) as Permission[]).map((p) => <tr key={p} className="hover:bg-primary-soft/30"><td className="px-5 py-2.5">{PERM_LABEL[p]}</td>{ROLES.map((r) => <td key={r} className="px-3 py-2.5 text-center">{ROLE_PERMISSIONS[r].includes(p) ? <Check className="mx-auto size-4 text-success" aria-label="Permitido" /> : <Minus className="mx-auto size-4 text-line-strong" aria-label="Sin permiso" />}</td>)}</tr>)}</tbody></table></div></Card>
      </div>
      <Modal open={open} onOpenChange={setOpen} title="Nuevo usuario" description="Usuario simulado para demostrar roles." size="sm" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button loading={isSubmitting} onClick={create}>Crear usuario</Button></>}>
        <div className="space-y-4"><Input label="Nombre completo" required error={errors.name?.message} {...register('name')} /><Input label="Correo" type="email" required error={errors.email?.message} {...register('email')} /><Select label="Rol" options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} {...register('role')} /></div>
      </Modal>
    </>
  )
}
