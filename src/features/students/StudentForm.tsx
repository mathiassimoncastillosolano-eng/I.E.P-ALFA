import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Contact, FileText, UserRound, UsersRound, X } from 'lucide-react'
import { useRef } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { DateField, Input, Select, Textarea } from '@/components/ui/Field'
import { SectionTitle } from '@/components/ui/Card'
import { studentSchema, type StudentFormValues } from '@/schemas'
import { studentService } from '@/services/studentService'
import { notify } from '@/utils/toast'

export const emptyStudent: StudentFormValues = {
  dni: '', names: '', paternalSurname: '', maternalSurname: '', birthDate: '', sex: 'M', address: '', phone: '', email: '', photo: undefined, notes: '',
  guardian: { dni: '', names: '', surnames: '', relationship: 'Madre', phone: '', email: '', address: '' },
}
const REL = ['Madre', 'Padre', 'Abuelo/a', 'Tío/a', 'Hermano/a mayor', 'Tutor/a legal'].map((v) => ({ value: v, label: v }))

export function StudentForm({ initial = emptyStudent, editingId, onSaved, onCancel, formId = 'student-form', hideActions }: {
  initial?: StudentFormValues; editingId?: string; onSaved: (id: string) => void; onCancel?: () => void; formId?: string; hideActions?: boolean
}) {
  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm<StudentFormValues>({ resolver: zodResolver(studentSchema), defaultValues: initial, mode: 'onBlur' })
  const file = useRef<HTMLInputElement>(null)
  const photo = watch('photo')
  const name = `${watch('names')} ${watch('paternalSurname')}`.trim() || 'Estudiante'
  const ge = errors.guardian as FieldErrors<StudentFormValues['guardian']> | undefined

  const onPhoto = (f?: File) => {
    if (!f) return
    if (!f.type.startsWith('image/') || f.size > 600_000) { notify.error(new Error('Seleccione una imagen de hasta 600 KB')); return }
    const r = new FileReader(); r.onload = () => setValue('photo', String(r.result)); r.readAsDataURL(f)
  }
  const submit = handleSubmit(async (v) => {
    if (studentService.existsDni(v.dni, editingId)) { setError('dni', { message: 'Ya existe un estudiante con este DNI' }); return }
    try {
      const s = editingId ? await studentService.update(editingId, v) : await studentService.create(v)
      notify.success(editingId ? 'Estudiante actualizado' : 'Estudiante registrado', `${s.names} ${s.paternalSurname} · ${s.code}`)
      onSaved(s.id)
    } catch (e) { notify.error(e) }
  })

  return (
    <form id={formId} onSubmit={submit} noValidate className="space-y-8">
      <section>
        <SectionTitle icon={<UserRound />}>A · Datos personales</SectionTitle>
        <div className="mb-5 flex items-center gap-4">
          <div className="relative"><Avatar name={name} src={photo} size="xl" />
            <button type="button" onClick={() => file.current?.click()} aria-label="Subir fotografía" className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-fg shadow-card transition-transform hover:scale-110"><Camera className="size-4" /></button>
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} /></div>
          <div className="text-xs text-muted"><p className="text-[13px] font-medium text-ink-2">Fotografía (opcional)</p>JPG o PNG, máx. 600 KB.{photo && <button type="button" onClick={() => setValue('photo', undefined)} className="ml-2 inline-flex items-center gap-0.5 text-danger hover:underline"><X className="size-3" />Quitar</button>}</div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="DNI" required inputMode="numeric" maxLength={8} placeholder="8 dígitos" error={errors.dni?.message} {...register('dni')} />
          <Input label="Nombres" required error={errors.names?.message} {...register('names')} />
          <Input label="Apellido paterno" required error={errors.paternalSurname?.message} {...register('paternalSurname')} />
          <Input label="Apellido materno" required error={errors.maternalSurname?.message} {...register('maternalSurname')} />
          <DateField label="Fecha de nacimiento" required error={errors.birthDate?.message} {...register('birthDate')} />
          <Select label="Sexo" required options={[{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }]} {...register('sex')} />
          <Input label="Dirección" required className="sm:col-span-2 lg:col-span-3" error={errors.address?.message} {...register('address')} />
        </div>
      </section>
      <section>
        <SectionTitle icon={<Contact />}>B · Información de contacto</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Teléfono" inputMode="tel" maxLength={9} placeholder="9XXXXXXXX" error={errors.phone?.message} {...register('phone')} />
          <Input label="Correo electrónico" type="email" error={errors.email?.message} {...register('email')} />
        </div>
      </section>
      <section>
        <SectionTitle icon={<UsersRound />}>C · Apoderado principal</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="DNI" required inputMode="numeric" maxLength={8} error={ge?.dni?.message} {...register('guardian.dni')} />
          <Input label="Nombres" required error={ge?.names?.message} {...register('guardian.names')} />
          <Input label="Apellidos" required error={ge?.surnames?.message} {...register('guardian.surnames')} />
          <Select label="Parentesco" required options={REL} error={ge?.relationship?.message} {...register('guardian.relationship')} />
          <Input label="Teléfono" required inputMode="tel" maxLength={9} error={ge?.phone?.message} {...register('guardian.phone')} />
          <Input label="Correo electrónico" required type="email" error={ge?.email?.message} {...register('guardian.email')} />
          <Input label="Dirección" required className="sm:col-span-2 lg:col-span-3" error={ge?.address?.message} {...register('guardian.address')} />
        </div>
      </section>
      <section>
        <SectionTitle icon={<FileText />}>D · Información adicional</SectionTitle>
        <Textarea label="Observaciones administrativas" hint="No registre información médica ni sensible." maxLength={300} error={errors.notes?.message} {...register('notes')} />
      </section>
      {!hideActions && <div className="flex justify-end gap-2 border-t border-line pt-5">{onCancel && <Button variant="ghost" onClick={onCancel}>Cancelar</Button>}<Button type="submit" loading={isSubmitting}>{editingId ? 'Guardar cambios' : 'Registrar estudiante'}</Button></div>}
    </form>
  )
}
