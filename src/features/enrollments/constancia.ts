import { db } from '@/services/db'
import { MONTH_NAMES } from '@/constants'
import { fullName, money } from '@/utils/format'
import { ESCUDO_SRC } from '@/components/shared/Escudo'

/** Constancia simulada: se abre en una ventana imprimible (todo en el navegador). */
export function printConstancia(enrollmentId: string) {
  const d = db()
  const e = d.enrollments.find((x) => x.id === enrollmentId)
  if (!e) return
  const s = d.students.find((x) => x.id === e.studentId)!
  const g = d.grades.find((x) => x.id === e.gradeId)!
  const sec = d.sections.find((x) => x.id === e.sectionId)!
  const y = d.academicYears.find((x) => x.id === e.yearId)!
  const guardian = d.guardians.find((x) => x.id === s.guardianId)
  const inst = d.institution
  const now = new Date('2026-11-07')
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Constancia ${e.code}</title>
<style>body{font-family:Inter,Arial,sans-serif;color:#172b4d;max-width:760px;margin:40px auto;padding:0 32px}
.h{display:flex;align-items:center;gap:16px;border-bottom:3px solid #173d91;padding-bottom:16px}.h img{width:64px;height:64px;object-fit:contain}
h1{font-size:20px;margin:0;color:#173d91}p.s{margin:2px 0 0;font-size:12px;color:#5b6b88}h2{text-align:center;letter-spacing:.12em;margin:36px 0 24px;font-size:18px}
p{line-height:1.8;font-size:14px}table{width:100%;border-collapse:collapse;margin:20px 0}td{padding:8px 10px;border:1px solid #dfe5f0;font-size:13px}td:first-child{background:#f4f6fa;width:34%;font-weight:600}
.f{margin-top:80px;display:flex;justify-content:space-between;font-size:12px;text-align:center}.f div{border-top:1px solid #172b4d;width:40%;padding-top:6px}
.n{margin-top:40px;font-size:11px;color:#8a97ad;text-align:center}button{margin-top:24px}@media print{button{display:none}}</style></head><body>
<div class="h"><img src="${location.origin}${ESCUDO_SRC}" onerror="this.style.display='none'" alt=""><div><h1>${inst.name}</h1><p class="s">${inst.address} · ${inst.phone}</p></div></div>
<h2>CONSTANCIA DE MATRÍCULA</h2>
<p>La dirección de <b>${inst.shortName}</b> deja constancia de que el/la estudiante <b>${fullName(s)}</b>, identificado/a con DNI <b>${s.dni}</b>, se encuentra <b>${e.status.toUpperCase()}</b> en el año académico <b>${y.year}</b>.</p>
<table><tr><td>Código de matrícula</td><td>${e.code}</td></tr><tr><td>Grado y sección</td><td>${g.name} · Sección ${sec.name}</td></tr>
<tr><td>Fecha de matrícula</td><td>${e.enrolledAt}</td></tr><tr><td>Apoderado</td><td>${guardian ? guardian.names + ' ' + guardian.surnames : '—'}</td></tr>
<tr><td>Matrícula</td><td>${money(e.matriculaAmount)}</td></tr><tr><td>Mensualidad</td><td>${money(e.mensualidadAmount * (1 - e.discountPct / 100))} × ${e.installments}</td></tr></table>
<p>Se expide la presente a solicitud del interesado, en Lima, a los ${now.getDate()} días de ${MONTH_NAMES[now.getMonth()].toLowerCase()} de ${now.getFullYear()}.</p>
<div class="f"><div>${inst.director}<br>Dirección</div><div>Secretaría</div></div>
<p class="n">Documento simulado generado por el sistema de demostración. Sin validez legal.</p>
<center><button onclick="print()">Imprimir / Guardar PDF</button></center></body></html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html); w.document.close()
}
