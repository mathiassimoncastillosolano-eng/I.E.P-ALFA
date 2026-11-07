import { toast } from 'sonner'
export const notify = {
  success: (m: string, description?: string) => toast.success(m, { description }),
  error: (e: unknown, fallback = 'Ocurrió un error') => toast.error(e instanceof Error ? e.message : fallback),
  info: (m: string, description?: string) => toast(m, { description }),
}
