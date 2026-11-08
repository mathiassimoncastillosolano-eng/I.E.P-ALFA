import { MotionConfig } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { useUi } from '@/stores/uiStore'

export function Providers({ children }: { children: ReactNode }) {
  const theme = useUi((s) => s.theme)
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark') }, [theme])
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        {children}
        <Toaster position="top-right" theme={theme} richColors closeButton toastOptions={{ style: { borderRadius: 14, fontFamily: 'inherit', boxShadow: 'var(--shadow-lg)' } }} />
      </TooltipProvider>
    </MotionConfig>
  )
}
