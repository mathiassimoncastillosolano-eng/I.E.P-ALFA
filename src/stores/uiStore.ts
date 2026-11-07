import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  yearId: string
  entered: boolean
  setEntered: (v: boolean) => void
  setTheme: (t: 'light' | 'dark') => void
  toggleTheme: () => void
  toggleSidebar: () => void
  setYear: (id: string) => void
}

const prefersDark = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches

export const useUi = create<UiState>()(
  persist(
    (set, get) => ({
      theme: prefersDark ? 'dark' : 'light',
      sidebarCollapsed: false,
      yearId: 'ay-2026',
      entered: false,
      setEntered: (entered) => set({ entered }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setYear: (yearId) => set({ yearId }),
    }),
    { name: 'iep-alfa:ui' },
  ),
)
