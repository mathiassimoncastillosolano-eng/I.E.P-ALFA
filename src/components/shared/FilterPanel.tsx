import type { ReactNode } from 'react'
import { FilterX } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function FilterPanel({ children, onClear, active }: { children: ReactNode; onClear?: () => void; active?: boolean }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {children}
      {onClear && <Button variant="ghost" size="md" icon={<FilterX />} onClick={onClear} disabled={!active}>Limpiar</Button>}
    </div>
  )
}
