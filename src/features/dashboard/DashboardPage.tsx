import { motion } from 'motion/react'
import { AlertTriangle, ArrowRight, BadgeDollarSign, CalendarClock, ClipboardList, CreditCard, GraduationCap, HandCoins, Info, Landmark, PlusCircle, Receipt, UserCheck, Users, Wallet } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { Card, CardHeader } from '@/components/ui/Card'
import { EnrollmentBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ChartSkeleton, CardSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { StatCard } from '@/components/shared/StatCard'
import { AnimatedNumber } from '@/components/shared/AnimatedNumber'
import { ChartBox, ChartLegend, ChartTooltip, axisProps, gridProps } from '@/components/shared/ChartParts'
import { useAsync } from '@/hooks/useAsync'
import { useCurrentUser } from '@/hooks/usePermission'
import { dashboardService } from '@/services/dashboardService'
import { useUi } from '@/stores/uiStore'
import { fmtDate, fmtDateTime, money, moneyCompact } from '@/utils/format'
import { PAYMENT_METHOD_LABEL } from '@/constants'
import { cx } from '@/utils/cn'

const C = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
const stagger = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 + i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } })

export default function DashboardPage() {
  const yearId = useUi((s) => s.yearId)
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => dashboardService.get(yearId), [yearId])
  const first = user.name.split(' ')[0]
  const hour = Number(new Date().toLocaleString('es-PE', { hour: '2-digit', hour12: false, timeZone: 'America/Lima' }))
  const greet = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>
  if (!data) return (
    <div className="space-y-6" role="status" aria-label="Cargando dashboard">
      <Skeleton className="h-40 rounded-[20px]" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      <div className="grid gap-4 lg:grid-cols-3"><Card className="lg:col-span-2"><ChartSkeleton /></Card><Card><ChartSkeleton /></Card></div>
    </div>
  )
  const k = data.kpis
  const levelTotal = data.byLevel.reduce((a, b) => a + b.value, 0)

  return (
    <div className={cx('space-y-6 transition-opacity', loading && 'opacity-70')}>
      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hero-surface relative overflow-hidden rounded-[20px] p-6 text-white shadow-card sm:p-8">
        <div className="pointer-events-none absolute -right-40 -top-24 size-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-28 top-6 size-40 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Año académico {data.year}</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]">{greet}, {first}.</h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/70">Este es el pulso administrativo de I.E.P. ALFA: {data.kpis.enrolled} estudiantes matriculados y una cobranza del {data.receivableRate.toFixed(1)}% sobre lo exigible.</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link to="/academico/matriculas/nueva"><Button className="!bg-white !text-[#173d91] hover:!brightness-95" icon={<PlusCircle />}>Nueva matrícula</Button></Link>
              <Link to="/economico/pagos?nuevo=1"><Button variant="ghost" className="!text-white ring-1 ring-white/25 hover:!bg-white/10" icon={<CreditCard />}>Registrar pago</Button></Link>
            </div>
          </div>
          <div className="flex gap-6 text-right">
            <div><p className="text-xs text-white/60">Recaudación del mes</p><p className="mt-1 text-3xl font-semibold tabular"><AnimatedNumber value={k.monthCollection} format={moneyCompact} /></p></div>
            <div className="hidden border-l border-white/15 pl-6 sm:block"><p className="text-xs text-white/60">Con deuda vencida</p><p className="mt-1 text-3xl font-semibold tabular"><AnimatedNumber value={k.debtors} /></p></div>
          </div>
        </div>
      </motion.section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard index={0} label="Total de estudiantes" value={k.totalStudents} icon={<Users />} hint="Registrados en el sistema" onClick={() => navigate('/academico/estudiantes')} />
        <StatCard index={1} label={`Matriculados ${data.year}`} value={k.enrolled} icon={<UserCheck />} tone="success" hint="Matrícula confirmada" onClick={() => navigate('/academico/matriculas?estado=matriculado')} />
        <StatCard index={2} label="Matrículas pendientes" value={k.pendingEnrollments} icon={<ClipboardList />} tone="warning" hint="Por completar" onClick={() => navigate('/academico/matriculas?estado=pendiente')} />
        <StatCard index={3} label="Ingresos del año" value={k.totalIncome} format={moneyCompact} icon={<Landmark />} tone="accent" hint="Pagos confirmados" onClick={() => navigate('/reportes/economicos')} />
        <StatCard index={4} label="Mensualidades pendientes" value={k.pendingTuitionAmount} format={moneyCompact} icon={<Wallet />} tone="danger" hint={`${k.pendingTuitionCount} cuotas exigibles`} onClick={() => navigate('/economico/deudas')} />
        <StatCard index={5} label="Estudiantes con deuda" value={k.debtors} icon={<AlertTriangle />} tone="danger" hint="Con cuotas vencidas" onClick={() => navigate('/economico/deudas?modo=vencidas')} />
        <StatCard index={6} label="Recaudación del mes" value={k.monthCollection} format={moneyCompact} icon={<HandCoins />} trend={k.monthTrend} hint="vs. mes anterior" onClick={() => navigate('/economico/pagos')} />
        <motion.div {...stagger(0)} className="relative flex items-center gap-4 overflow-hidden rounded-[14px] border border-line bg-surface p-4 shadow-soft">
          <div className="relative size-[74px] shrink-0">
            <svg viewBox="0 0 36 36" className="size-full -rotate-90"><circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--surface-3)" strokeWidth="3.5" /><motion.circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="97.4" initial={{ strokeDashoffset: 97.4 }} animate={{ strokeDashoffset: 97.4 * (1 - data.receivableRate / 100) }} transition={{ duration: 1.1, ease: 'easeOut' }} /></svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular">{Math.round(data.receivableRate)}%</span>
          </div>
          <div><p className="text-[12.5px] font-medium text-muted">Índice de cobranza</p><p className="mt-0.5 text-sm font-semibold text-ink">Pagado / exigible</p><p className="text-xs text-muted">Al {fmtDate('2026-11-07')}</p></div>
        </motion.div>
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div {...stagger(1)} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader title="Evolución mensual de ingresos" description={`Pagos confirmados por fecha de pago · ${data.year}`} />
            <ChartBox h={280}>
              <ResponsiveContainer><AreaChart data={data.monthlyIncome} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                <defs><linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid {...gridProps} /><XAxis dataKey="month" {...axisProps} /><YAxis {...axisProps} tickFormatter={(v) => moneyCompact(v)} width={56} />
                <RTooltip content={<ChartTooltip fmt={money} />} cursor={{ stroke: 'var(--border-strong)' }} />
                <Area type="monotone" dataKey="total" name="Ingresos" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gInc)" animationDuration={900} dot={false} activeDot={{ r: 5 }} />
              </AreaChart></ResponsiveContainer>
            </ChartBox>
          </Card>
        </motion.div>
        <motion.div {...stagger(2)}>
          <Card className="h-full">
            <CardHeader title="Matrículas por nivel" description="Vigentes y pendientes" />
            <div className="relative px-2" style={{ height: 210 }}>
              <ResponsiveContainer><PieChart><Pie data={data.byLevel} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} cornerRadius={6} stroke="none" animationDuration={900}>{data.byLevel.map((_, i) => <Cell key={i} fill={C[i]} />)}</Pie><RTooltip content={<ChartTooltip />} /></PieChart></ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><p className="text-3xl font-semibold tabular">{levelTotal}</p><p className="text-xs text-muted">estudiantes</p></div>
            </div>
            <div className="space-y-2 px-5 pb-5">
              {data.byLevel.map((l, i) => (
                <div key={l.name} className="flex items-center justify-between text-[13px]"><span className="flex items-center gap-2 text-ink-2"><span className="size-2.5 rounded-full" style={{ background: C[i] }} />{l.name}</span><b className="tabular">{l.value} <span className="font-normal text-muted">· {levelTotal ? Math.round((l.value / levelTotal) * 100) : 0}%</span></b></div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div {...stagger(3)}>
          <Card className="h-full">
            <CardHeader title="Distribución por grado" description="Estudiantes con matrícula vigente" action={<ChartLegend items={[{ label: 'Primaria', color: C[0] }, { label: 'Secundaria', color: C[1] }]} />} />
            <ChartBox h={250}>
              <ResponsiveContainer><BarChart data={data.byGrade} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid {...gridProps} /><XAxis dataKey="name" {...axisProps} interval={0} tick={{ fill: 'var(--muted)', fontSize: 10.5 }} /><YAxis {...axisProps} allowDecimals={false} />
                <RTooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-3)' }} />
                <Bar dataKey="value" name="Estudiantes" radius={[6, 6, 0, 0]} animationDuration={900}>{data.byGrade.map((g, i) => <Cell key={i} fill={g.level === 'primaria' ? C[0] : C[1]} />)}</Bar>
              </BarChart></ResponsiveContainer>
            </ChartBox>
          </Card>
        </motion.div>
        <motion.div {...stagger(4)}>
          <Card className="h-full">
            <CardHeader title="Pagos realizados vs. pendientes" description="Por mes de vencimiento" action={<ChartLegend items={[{ label: 'Pagado', color: C[0] }, { label: 'Pendiente', color: C[2] }]} />} />
            <ChartBox h={250}>
              <ResponsiveContainer><BarChart data={data.dueVsPaid} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid {...gridProps} /><XAxis dataKey="month" {...axisProps} /><YAxis {...axisProps} tickFormatter={(v) => moneyCompact(v)} width={56} />
                <RTooltip content={<ChartTooltip fmt={money} />} cursor={{ fill: 'var(--surface-3)' }} />
                <Bar dataKey="paid" name="Pagado" stackId="a" fill={C[0]} animationDuration={900} /><Bar dataKey="pending" name="Pendiente" stackId="a" fill={C[2]} radius={[5, 5, 0, 0]} animationDuration={900} />
              </BarChart></ResponsiveContainer>
            </ChartBox>
          </Card>
        </motion.div>
      </div>

      <motion.div {...stagger(5)}>
        <Card>
          <CardHeader title="Evolución anual de la recaudación" description="Recaudado vs. esperado por año académico" action={<ChartLegend items={[{ label: 'Recaudado', color: C[0] }, { label: 'Esperado', color: C[4] }]} />} />
          <ChartBox h={220}>
            <ResponsiveContainer><LineChart data={data.annual} margin={{ top: 10, right: 24, left: -4, bottom: 0 }}>
              <CartesianGrid {...gridProps} /><XAxis dataKey="year" {...axisProps} /><YAxis {...axisProps} tickFormatter={(v) => moneyCompact(v)} width={60} />
              <RTooltip content={<ChartTooltip fmt={money} />} />
              <Line type="monotone" dataKey="expected" name="Esperado" stroke={C[4]} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} animationDuration={900} />
              <Line type="monotone" dataKey="total" name="Recaudado" stroke={C[0]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--surface)' }} activeDot={{ r: 6 }} animationDuration={900} />
            </LineChart></ResponsiveContainer>
          </ChartBox>
        </Card>
      </motion.div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div {...stagger(6)} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader title="Alertas administrativas" />
            <ul className="space-y-1 px-3 pb-4">
              {data.alerts.map((a) => (
                <li key={a.id}><Link to={a.href} className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-surface-3">
                  <span className={cx('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg [&>svg]:size-4', a.level === 'danger' ? 'bg-danger-soft text-danger' : a.level === 'warning' ? 'bg-warning-soft text-warning' : 'bg-accent-soft text-accent')}>{a.level === 'info' ? <Info /> : <AlertTriangle />}</span>
                  <div className="min-w-0 flex-1"><p className="text-[13px] font-medium text-ink">{a.title}</p><p className="text-xs text-muted">{a.detail}</p></div>
                  <ArrowRight className="mt-1 size-4 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link></li>
              ))}
              {!data.alerts.length && <p className="p-4 text-center text-sm text-muted">Sin alertas. Todo al día.</p>}
            </ul>
            <div className="border-t border-line px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Accesos rápidos</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ to: '/academico/estudiantes?nuevo=1', icon: GraduationCap, l: 'Nuevo estudiante' }, { to: '/academico/matriculas/nueva', icon: ClipboardList, l: 'Matricular' }, { to: '/economico/pagos?nuevo=1', icon: BadgeDollarSign, l: 'Cobrar' }, { to: '/economico/estados-cuenta', icon: Receipt, l: 'Estado de cuenta' }].map((q) => (
                  <Link key={q.l} to={q.to} className="group flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-[13px] font-medium text-ink-2 transition-all hover:border-primary/40 hover:bg-primary-soft hover:text-primary"><q.icon className="size-4 transition-transform group-hover:scale-110" />{q.l}</Link>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div {...stagger(7)}>
          <Card className="h-full">
            <CardHeader title="Últimas matrículas" action={<Link to="/academico/matriculas" className="text-xs font-medium text-primary hover:underline">Ver todas</Link>} />
            <ul className="divide-y divide-line px-2 pb-2">
              {data.recentEnrollments.map((e) => (
                <li key={e.id}><Link to={`/academico/matriculas/${e.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-3"><Avatar name={e.name} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{e.name}</p><p className="text-xs text-muted">{e.grade} · {fmtDate(e.date)}</p></div><EnrollmentBadge status={e.status} /></Link></li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Próximos vencimientos</p>
              <ul className="space-y-2">{data.upcoming.map((u) => (
                <li key={u.date} className="flex items-center gap-3 text-[13px]"><span className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent"><CalendarClock className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate font-medium">{fmtDate(u.date)}</p><p className="text-xs text-muted">{u.count} cuotas · {u.label}</p></div><b className="tabular">{moneyCompact(u.amount)}</b></li>
              ))}</ul></div>
          </Card>
        </motion.div>

        <motion.div {...stagger(8)}>
          <Card className="h-full">
            <CardHeader title="Últimos pagos" action={<Link to="/economico/pagos" className="text-xs font-medium text-primary hover:underline">Ver todos</Link>} />
            <ul className="divide-y divide-line px-2 pb-2">
              {data.recentPayments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success"><CreditCard className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{p.name}</p><p className="text-xs text-muted">{p.code} · {PAYMENT_METHOD_LABEL[p.method]}</p></div><b className="text-[13px] tabular">{money(p.total)}</b></li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Actividad reciente</p>
              <ul className="space-y-2.5">{data.activity.slice(0, 4).map((a) => (
                <li key={a.id} className="flex gap-2.5 text-xs"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" /><div className="min-w-0"><p className="truncate text-ink-2">{a.description}</p><p className="text-muted">{a.userName} · {fmtDateTime(a.at)}</p></div></li>
              ))}</ul></div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
