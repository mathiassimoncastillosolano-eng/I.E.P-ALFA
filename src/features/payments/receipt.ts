import { db } from '@/services/db'
import { paymentRows } from '@/services/financialService'
import { ESCUDO_SRC } from '@/components/shared/Escudo'
import { PAYMENT_METHOD_LABEL } from '@/constants'
import { money } from '@/utils/format'

/** Comprobante interno simulado (sin valor tributario). */
export function printReceipt(paymentId: string, _manual = true) {
  void _manual
  const p = paymentRows((x) => x.id === paymentId)[0]
  if (!p) return
  const inst = db().institution
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${p.code}</title><style>body{font-family:Inter,Arial,sans-serif;color:#172b4d;max-width:520px;margin:32px auto;padding:0 24px}
.h{display:flex;gap:12px;align-items:center;border-bottom:3px solid #173d91;padding-bottom:12px}.h img{width:48px;height:48px;object-fit:contain}h1{font-size:16px;margin:0;color:#173d91}small{color:#5b6b88}
h2{text-align:center;font-size:14px;letter-spacing:.1em;margin:22px 0 4px}.c{text-align:center;font-family:monospace;color:#d92735;margin-bottom:18px}
table{width:100%;border-collapse:collapse;font-size:13px}td{padding:7px 4px;border-bottom:1px dashed #cfd7e6}td:last-child{text-align:right}.t td{font-weight:700;font-size:15px;border-bottom:0}
.n{margin-top:28px;font-size:10.5px;color:#8a97ad;text-align:center}@media print{button{display:none}}</style></head><body>
<div class="h"><img src="${location.origin}${ESCUDO_SRC}" onerror="this.style.display='none'" alt=""><div><h1>${inst.shortName}</h1><small>${inst.address}</small></div></div>
<h2>COMPROBANTE INTERNO DE PAGO</h2><div class="c">${p.code}${p.status === 'anulado' ? ' · ANULADO' : ''}</div>
<table><tr><td>Estudiante</td><td>${p.studentName}</td></tr><tr><td>DNI</td><td>${p.studentDni}</td></tr><tr><td>Fecha</td><td>${p.date}</td></tr><tr><td>Método</td><td>${PAYMENT_METHOD_LABEL[p.method]}${p.operationNumber ? ' · ' + p.operationNumber : ''}</td></tr>
${p.details.map((d) => `<tr><td>${d.label}</td><td>${money(d.amount)}</td></tr>`).join('')}<tr class="t"><td>TOTAL</td><td>${money(p.total)}</td></tr></table>
<p class="n">Comprobante simulado de demostración. Sin valor tributario.</p><center><button onclick="print()">Imprimir</button></center></body></html>`)
  w.document.close()
}
