import { create } from 'zustand';

/** `tick` cambia tras cada operación para que las pantallas vuelvan a pedir sus datos a los servicios. */
interface AppState { tick: number; bump: () => void }
export const useApp = create<AppState>((set) => ({ tick: 0, bump: () => set((s) => ({ tick: s.tick + 1 })) }));
