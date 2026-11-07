import * as T from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

export const TooltipProvider = T.Provider
export function Tooltip({ label, children, side = 'top', disabled }: { label: string; children: ReactNode; side?: 'top' | 'right' | 'bottom' | 'left'; disabled?: boolean }) {
  if (disabled) return <>{children}</>
  return (
    <T.Root delayDuration={150}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={side} sideOffset={8} className="z-[70] rounded-lg bg-[#0f1a3a] px-2.5 py-1.5 text-xs font-medium text-white shadow-pop data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95">
          {label}<T.Arrow className="fill-[#0f1a3a]" />
        </T.Content>
      </T.Portal>
    </T.Root>
  )
}
