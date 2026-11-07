import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { useDataVersion } from '@/stores/dataStore'

export interface AsyncState<T> { data: T | undefined; loading: boolean; error: string | null; reload: () => void }

/** Ejecuta una llamada de servicio y se refresca automáticamente tras cualquier mutación de datos. */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList = []): AsyncState<T> {
  const version = useDataVersion((s) => s.version)
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const seq = useRef(0)
  const first = useRef(true)

  useEffect(() => {
    const id = ++seq.current
    // En refrescos por mutación no se vuelve al skeleton: se mantiene el dato anterior.
    if (first.current || data === undefined) setLoading(true)
    setError(null)
    fn().then((r) => { if (id === seq.current) { setData(r); setLoading(false); first.current = false } })
      .catch((e: unknown) => { if (id === seq.current) { setError(e instanceof Error ? e.message : 'Error inesperado'); setLoading(false) } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, tick, ...deps])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload }
}
