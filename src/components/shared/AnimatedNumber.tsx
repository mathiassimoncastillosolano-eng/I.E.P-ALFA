import { animate, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

export function AnimatedNumber({ value, format = (n: number) => Math.round(n).toLocaleString('es-PE'), duration = 0.9 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(reduce ? value : 0)
  const [text, setText] = useState(format(reduce ? value : 0))
  useEffect(() => {
    if (reduce) { setText(format(value)); return }
    const c = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setText(format(v)) })
    return () => c.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce])
  return <span className="tabular">{text}</span>
}
