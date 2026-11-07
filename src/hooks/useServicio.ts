import { useEffect, useState } from 'react';
import { useApp } from '@/stores/app';

export function useServicio<T>(cargar: () => Promise<T>, deps: unknown[] = []): T | null {
  const tick = useApp((s) => s.tick);
  const [datos, setDatos] = useState<T | null>(null);
  useEffect(() => {
    let vivo = true;
    cargar().then((d) => { if (vivo) setDatos(d); }).catch(() => { if (vivo) setDatos(null); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);
  return datos;
}
