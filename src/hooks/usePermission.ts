import { useDataVersion } from '@/stores/dataStore'
import { userService } from '@/services/userService'
import type { Permission } from '@/types'

export function useCurrentUser() {
  useDataVersion((s) => s.version)
  return userService.current()
}
export function useCan() {
  const u = useCurrentUser()
  return (p: Permission) => userService.can(p, u.role)
}
