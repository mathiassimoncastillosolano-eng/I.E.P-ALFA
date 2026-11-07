import { create } from 'zustand'

/** Contador de versión: se incrementa tras cada mutación para que los hooks de datos se refresquen. */
export const useDataVersion = create<{ version: number; bump: () => void }>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}))
