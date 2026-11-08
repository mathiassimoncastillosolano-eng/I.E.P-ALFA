import * as D from '@radix-ui/react-dropdown-menu'
import type { ReactNode } from 'react'
import { cx } from '@/utils/cn'

export interface MenuItem { label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean; disabled?: boolean; separatorBefore?: boolean }

export function Dropdown({ trigger, items, align = 'end', header, width = 'w-56' }: { trigger: ReactNode; items: MenuItem[]; align?: 'start' | 'end'; header?: ReactNode; width?: string }) {
  return (
    <D.Root>
      <D.Trigger asChild>{trigger}</D.Trigger>
      <D.Portal>
        <D.Content align={align} sideOffset={8} className={cx('z-[60] overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-pop data-[state=open]:animate-pop', width)}>
          {header && <div className="border-b border-line px-2.5 pb-2 pt-1.5">{header}</div>}
          <div className={header ? 'pt-1.5' : ''}>
            {items.map((it, i) => (
              <div key={i}>
                {it.separatorBefore && <D.Separator className="my-1 h-px bg-line" />}
                <D.Item disabled={it.disabled} onSelect={it.onSelect}
                  className={cx('flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] outline-none transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 [&>svg]:size-4',
                    it.danger ? 'text-danger data-[highlighted]:bg-danger-soft' : 'text-ink data-[highlighted]:bg-surface-3')}>
                  {it.icon}{it.label}
                </D.Item>
              </div>
            ))}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}
