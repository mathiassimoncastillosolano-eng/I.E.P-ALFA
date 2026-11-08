import { DatabaseBackup, Download, HardDrive, Landmark, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/Confirm'
import { Input } from '@/components/ui/Field'
import { Escudo } from '@/components/shared/Escudo'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAsync } from '@/hooks/useAsync'
import { useCan } from '@/hooks/usePermission'
import { db } from '@/services/db'
import { settingsService } from '@/services/userService'
import { notify } from '@/utils/toast'
import type { Institution } from '@/types'

export default function SettingsPage() {
  const inst = useAsync(() => settingsService.institution(), [])
  const can = useCan()
  const [reset, setReset] = useState(false)
  const { register, handleSubmit, reset: rf, formState: { isSubmitting, isDirty } } = useForm<Institution>()
  useEffect(() => { if (inst.data) rf(inst.data) }, [inst.data, rf])
  const save = handleSubmit(async (v) => { try { await settingsService.updateInstitution(v); notify.success('Datos institucionales actualizados') } catch (e) { notify.error(e) } })
  const d = db()
  const stats = [['Estudiantes', d.students.length], ['Matrículas', d.enrollments.length], ['Obligaciones', d.obligations.length], ['Pagos', d.payments.length], ['Eventos de auditoría', d.audit.length]]
  const ro = !can('settings.write')

  const exportBackup = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'iep-alfa-demo-datos.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 500)
    notify.success('Respaldo descargado')
  }
  return (
    <>
      <PageHeader eyebrow="Administración" title="Configuración institucional" description="Datos de la institución y gestión de los datos de demostración." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader title="Datos de la institución" action={<Escudo size={44} />} />
          <form onSubmit={save} className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
            <Input label="Nombre institucional" className="sm:col-span-2" disabled={ro} {...register('name')} /><Input label="Nombre corto" disabled={ro} {...register('shortName')} /><Input label="UGEL" disabled={ro} {...register('ugel')} />
            <Input label="Dirección" className="sm:col-span-2" disabled={ro} {...register('address')} /><Input label="Teléfono" disabled={ro} {...register('phone')} /><Input label="Correo" disabled={ro} {...register('email')} /><Input label="Director(a)" className="sm:col-span-2" disabled={ro} {...register('director')} />
            <div className="flex justify-end sm:col-span-2"><Button type="submit" icon={<Landmark />} loading={isSubmitting} disabled={ro || !isDirty}>Guardar cambios</Button></div>
          </form></Card>
        <div className="space-y-4">
          <Card><CardHeader title="Datos de demostración" description="Persisten en este navegador (localStorage)." />
            <dl className="divide-y divide-line px-5 text-[13px]">{stats.map(([k, v]) => <div key={k as string} className="flex justify-between py-2"><dt className="text-muted">{k}</dt><dd className="font-semibold tabular">{v}</dd></div>)}</dl>
            <div className="space-y-2 p-5"><Button variant="secondary" className="w-full" icon={<Download />} onClick={exportBackup}>Descargar respaldo JSON</Button>
              <Button variant="danger" className="w-full" icon={<DatabaseBackup />} onClick={() => setReset(true)}>Restablecer datos de demostración</Button></div></Card>
          <Card className="flex gap-3 p-5 text-[13px] text-muted"><ShieldCheck className="size-5 shrink-0 text-success" /><p>Sin backend ni base de datos: todo se ejecuta en el navegador sobre servicios simulados, listos para reemplazarse por una API real.</p></Card>
          <Card className="flex gap-3 p-5 text-[13px] text-muted"><HardDrive className="size-5 shrink-0 text-primary" /><p>Fecha simulada del sistema: <b className="text-ink">07 nov 2026</b>. Los vencimientos y estados se calculan contra ella.</p></Card>
        </div>
      </div>
      <ConfirmDialog open={reset} onOpenChange={setReset} tone="danger" title="Restablecer datos de demostración" confirmLabel="Restablecer" description="Se perderán todos los cambios y se restaurarán los datos iniciales." onConfirm={async () => { await settingsService.reset(); notify.success('Datos restablecidos') }} />
    </>
  )
}
