import type { ColumnDef } from '@tanstack/react-table'
import { Lock, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { SearchInput, Select } from '@/components/ui/Field'
import { FilterPanel } from '@/components/shared/FilterPanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAsync } from '@/hooks/useAsync'
import { useCan } from '@/hooks/usePermission'
import { useDebounced } from '@/hooks/useDebounced'
import { auditService } from '@/services/auditService'
import { MODULE_LABEL } from '@/constants'
import { fmtDateTime } from '@/utils/format'
import type { AuditAction, AuditEvent, AuditModule } from '@/types'
import { userService } from '@/services/userService'

const actionTone: Record<AuditAction, 'success' | 'primary' | 'danger' | 'warning' | 'accent' | 'neutral'> = { crear: 'success', editar: 'primary', retirar: 'warning', anular: 'danger', reversar: 'danger', finalizar: 'accent', configurar: 'neutral', restablecer: 'warning' }
const ACTIONS: AuditAction[] = ['crear', 'editar', 'retirar', 'anular', 'reversar', 'finalizar', 'configurar', 'restablecer']

export function AuditTable({ title, eyebrow, description }: { title: string; eyebrow: string; description: string }) {
  const [q, setQ] = useState('')
  const [module, setModule] = useState<AuditModule | ''>('')
  const [action, setAction] = useState<AuditAction | ''>('')
  const [userId, setUserId] = useState('')
  const dq = useDebounced(q)
  const list = useAsync(() => auditService.list({ q: dq, module, action, userId }), [dq, module, action, userId])
  const users = useAsync(() => userService.list(), [])
  const columns = useMemo<ColumnDef<AuditEvent, unknown>[]>(() => [
    { accessorKey: 'id', header: 'ID', cell: (c) => <span className="font-mono text-xs text-muted">{c.getValue() as string}</span> },
    { accessorKey: 'at', header: 'Fecha y hora', cell: (c) => <span className="whitespace-nowrap">{fmtDateTime(c.getValue() as string)}</span> },
    { accessorKey: 'userName', header: 'Usuario' },
    { accessorKey: 'action', header: 'Acción', cell: (c) => <Badge tone={actionTone[c.getValue() as AuditAction]} className="capitalize">{c.getValue() as string}</Badge> },
    { accessorKey: 'module', header: 'Módulo', cell: (c) => MODULE_LABEL[c.getValue() as AuditModule] },
    { accessorKey: 'description', header: 'Descripción', cell: (c) => <span className="block max-w-md whitespace-normal">{c.getValue() as string}</span> },
    { accessorKey: 'entity', header: 'Entidad', cell: (c) => <span className="font-mono text-xs">{c.getValue() as string}</span> },
  ], [])
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={<Badge tone="primary"><Lock className="size-3" />Solo lectura · inmutable</Badge>} />
      <DataTable data={list.data} loading={list.loading} error={list.error} onRetry={list.reload} columns={columns} pageSize={20} resetKey={`${dq}${module}${action}${userId}`}
        empty={{ title: 'Sin eventos', description: 'No hay eventos que coincidan.' }}
        toolbar={<FilterPanel active={!!(q || module || action || userId)} onClear={() => { setQ(''); setModule(''); setAction(''); setUserId('') }}>
          <SearchInput value={q} onChange={setQ} placeholder="Descripción, entidad o usuario…" className="w-full sm:w-72" />
          <Select aria-label="Módulo" value={module} onChange={(e) => setModule(e.target.value as AuditModule | '')} placeholder="Todos los módulos" options={Object.entries(MODULE_LABEL).map(([value, label]) => ({ value, label }))} className="w-48" />
          <Select aria-label="Acción" value={action} onChange={(e) => setAction(e.target.value as AuditAction | '')} placeholder="Todas las acciones" options={ACTIONS.map((a) => ({ value: a, label: a[0].toUpperCase() + a.slice(1) }))} className="w-48" />
          <Select aria-label="Usuario" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Todos los usuarios" options={users.data?.map((u) => ({ value: u.id, label: u.name })) ?? []} className="w-52" />
        </FilterPanel>} />
    </>
  )
}

export default function AuditPage() {
  const can = useCan()
  if (!can('audit.read')) return <Card className="mx-auto mt-10 max-w-md p-10 text-center"><ShieldCheck className="mx-auto mb-3 size-8 text-muted" /><p className="font-semibold">Acceso restringido</p><p className="mt-1 text-sm text-muted">Su rol no tiene permiso para ver la auditoría. Cambie de usuario desde el menú de perfil.</p></Card>
  return <AuditTable eyebrow="Administración" title="Auditoría" description="Registro cronológico de todas las operaciones relevantes. No se puede editar ni eliminar." />
}
