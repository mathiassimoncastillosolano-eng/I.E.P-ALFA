import type { AuditAction, AuditEvent, AuditModule } from '@/types'
import { clone, db, delay } from './db'

export interface AuditFilters { q?: string; module?: AuditModule | ''; action?: AuditAction | ''; userId?: string }

export const auditService = {
  list(f: AuditFilters = {}): Promise<AuditEvent[]> {
    return delay(() => {
      const q = f.q?.toLowerCase().trim()
      return clone(db().audit)
        .filter((e) => (!f.module || e.module === f.module) && (!f.action || e.action === f.action) && (!f.userId || e.userId === f.userId))
        .filter((e) => !q || `${e.description} ${e.entity} ${e.userName}`.toLowerCase().includes(q))
        .sort((a, b) => b.at.localeCompare(a.at))
    }, 200)
  },
  forEntities(entities: string[]): Promise<AuditEvent[]> {
    return delay(() => clone(db().audit).filter((e) => entities.includes(e.entity)).sort((a, b) => b.at.localeCompare(a.at)), 150)
  },
}
