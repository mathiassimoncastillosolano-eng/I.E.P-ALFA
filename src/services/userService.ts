import type { Institution, RoleId, User } from '@/types'
import type { UserFormValues } from '@/schemas'
import { userSchema } from '@/schemas'
import { ApiError, clone, commit, currentUser, db, delay, logAudit, nextId, resetDatabase } from './db'
import { ROLE_PERMISSIONS } from '@/constants'
import type { Permission } from '@/types'

export const userService = {
  list(): Promise<User[]> { return delay(() => clone(db().users), 150) },
  current(): User { return clone(currentUser()) },
  can(perm: Permission, role: RoleId = currentUser().role): boolean { return ROLE_PERMISSIONS[role].includes(perm) },
  /** Cambio simulado de usuario (no existe autenticación real). */
  switchTo(id: string): Promise<User> {
    return delay(() => {
      const u = db().users.find((x) => x.id === id)
      if (!u || !u.active) throw new ApiError('Usuario no disponible')
      db().currentUserId = id
      u.lastAccess = new Date().toISOString().slice(0, 19)
      commit()
      return clone(u)
    }, 250)
  },
  create(v: UserFormValues): Promise<User> {
    return delay(() => {
      const p = userSchema.safeParse(v)
      if (!p.success) throw new ApiError(p.error.issues[0].message)
      if (db().users.some((u) => u.email === p.data.email)) throw new ApiError('Ya existe un usuario con ese correo', 'DUPLICATE')
      const u: User = { id: nextId('u'), ...p.data, active: true, lastAccess: '—' }
      db().users.push(u)
      logAudit('crear', 'usuarios', `Creó el usuario ${u.name} (${u.role})`, u.id)
      commit()
      return clone(u)
    })
  },
  update(id: string, patch: Partial<Pick<User, 'role' | 'active' | 'name'>>): Promise<User> {
    return delay(() => {
      const u = db().users.find((x) => x.id === id)
      if (!u) throw new ApiError('Usuario no encontrado', 'NOT_FOUND')
      if (id === db().currentUserId && (patch.active === false || (patch.role && patch.role !== 'administrador'))) throw new ApiError('No puede desactivarse ni quitarse el rol a sí mismo')
      Object.assign(u, patch)
      logAudit('editar', 'usuarios', `Actualizó al usuario ${u.name}`, u.id)
      commit()
      return clone(u)
    })
  },
}

export const settingsService = {
  institution(): Promise<Institution> { return delay(() => clone(db().institution), 120) },
  updateInstitution(v: Institution): Promise<Institution> {
    return delay(() => {
      if (v.name.trim().length < 3) throw new ApiError('Nombre institucional obligatorio')
      Object.assign(db().institution, v)
      logAudit('configurar', 'configuracion', 'Actualizó los datos institucionales', 'institucion')
      commit()
      return clone(db().institution)
    })
  },
  reset(): Promise<void> {
    return delay(() => { resetDatabase() }, 700)
  },
}
