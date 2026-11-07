import { DB_STORAGE_KEY, DB_VERSION } from '@/constants'
import { generateSeed } from '@/mocks/seeds/generate'
import { useDataVersion } from '@/stores/dataStore'
import type { AuditAction, AuditEvent, AuditModule, Database } from '@/types'

export class ApiError extends Error {
  code: string
  constructor(message: string, code = 'BAD_REQUEST') { super(message); this.code = code }
}

function load(): Database {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (parsed.version === DB_VERSION) return parsed
    }
  } catch { /* datos corruptos: se regenera */ }
  const seed = generateSeed()
  try { localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(seed)) } catch { /* cuota */ }
  return seed
}

let state: Database = load()

/** Acceso de solo lectura a la "base de datos". Los servicios son los únicos que la mutan. */
export const db = () => state
export const clone = <T,>(v: T): T => structuredClone(v)

export function commit() {
  try { localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state)) } catch { /* cuota */ }
  useDataVersion.getState().bump()
}

export function resetDatabase() {
  state = generateSeed()
  commit()
}

export function nextId(prefix: string): string {
  state.counters[prefix] = (state.counters[prefix] ?? 0) + 1
  return `${prefix}-${String(state.counters[prefix]).padStart(4, '0')}`
}
export function nextCode(prefix: string, width = 5): string {
  const key = `code:${prefix}`
  state.counters[key] = (state.counters[key] ?? 0) + 1
  return `${prefix}-${String(state.counters[key]).padStart(width, '0')}`
}

export function delay<T>(value: () => T, ms = 220 + Math.random() * 260): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try { resolve(value()) } catch (e) { reject(e) }
    }, ms)
  })
}

export function currentUser() {
  return state.users.find((u) => u.id === state.currentUserId) ?? state.users[0]
}

export function logAudit(action: AuditAction, module: AuditModule, description: string, entity: string) {
  const u = currentUser()
  const ev: AuditEvent = {
    id: nextId('aud'), at: new Date().toISOString().slice(0, 19), userId: u.id, userName: u.name, action, module, description, entity,
  }
  state.audit.push(ev)
}
