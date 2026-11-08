/**
 * Utilidades para que los controles personalizados (Select, DateField) sigan siendo compatibles con
 * `react-hook-form` (`register`) y con formularios controlados: cada control mantiene un elemento
 * nativo oculto que es la "fuente de verdad" del valor.
 */
type ValueEl = HTMLSelectElement | HTMLInputElement
const notifiers = new WeakMap<ValueEl, (v: string) => void>()
const protoOf = (el: ValueEl) => (el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype)

/** Escribe el valor sin pasar por el rastreador interno de React y dispara el evento para que `onChange` se ejecute. */
export function commitNativeValue(el: ValueEl, value: string, eventName: 'change' | 'input') {
  const setter = Object.getOwnPropertyDescriptor(protoOf(el), 'value')?.set
  if (!setter) return
  setter.call(el, value)
  el.dispatchEvent(new Event(eventName, { bubbles: true }))
}

/** Avisa cuando alguien (p. ej. react-hook-form en `reset`/`setValue`) asigna `el.value = …` por código. */
export function watchNativeValue(el: ValueEl, cb: (v: string) => void) {
  const had = notifiers.has(el)
  notifiers.set(el, cb)
  if (had) return
  const d = Object.getOwnPropertyDescriptor(el, 'value') ?? Object.getOwnPropertyDescriptor(protoOf(el), 'value')
  if (!d?.get || !d.set) return
  const { get, set } = d
  Object.defineProperty(el, 'value', {
    configurable: true,
    get() { return get.call(el) as string },
    set(v: string) { set.call(el, v); notifiers.get(el)?.(get.call(el) as string) },
  })
}
