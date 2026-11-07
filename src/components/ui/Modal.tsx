import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '@/utils/cn'
import { IconButton } from './Button'

interface Props { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }
const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

export function Modal({ open, onOpenChange, title, description, children, footer, size = 'md' }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-[#0a1130]/50 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </Dialog.Overlay>
            <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
              <Dialog.Content asChild forceMount>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className={cx('flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[20px] border border-line bg-surface shadow-pop sm:rounded-[20px]', widths[size])}
                >
                  <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
                    <div><Dialog.Title className="text-base font-semibold tracking-tight text-ink">{title}</Dialog.Title>
                      <Dialog.Description className={description ? 'mt-0.5 text-[13px] text-muted' : 'sr-only'}>{description ?? title}</Dialog.Description></div>
                    <Dialog.Close asChild><IconButton label="Cerrar" size="sm"><X /></IconButton></Dialog.Close>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
                  {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2 px-6 py-3.5">{footer}</div>}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

export function Drawer({ open, onOpenChange, title, description, children, footer, width = 'max-w-lg' }: Omit<Props, 'size'> & { width?: string }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-[#0a1130]/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.aside
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                className={cx('fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-surface shadow-pop', width)}
              >
                <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
                  <div><Dialog.Title className="text-base font-semibold text-ink">{title}</Dialog.Title>
                    <Dialog.Description className={description ? 'mt-0.5 text-[13px] text-muted' : 'sr-only'}>{description ?? title}</Dialog.Description></div>
                  <Dialog.Close asChild><IconButton label="Cerrar" size="sm"><X /></IconButton></Dialog.Close>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
                {footer && <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-2 px-6 py-3.5">{footer}</div>}
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
