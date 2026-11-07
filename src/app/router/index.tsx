import { lazy } from 'react'
import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { RequireSession } from './RequireSession'
import { RouteError } from './RouteError'

const L = (f: () => Promise<{ default: React.ComponentType }>) => lazy(f)
const Login = L(() => import('@/features/users/LoginPage'))
const Dashboard = L(() => import('@/features/dashboard/DashboardPage'))
const Students = L(() => import('@/features/students/StudentsPage'))
const StudentDetail = L(() => import('@/features/students/StudentDetailPage'))
const Enrollments = L(() => import('@/features/enrollments/EnrollmentsPage'))
const EnrollmentWizard = L(() => import('@/features/enrollments/EnrollmentWizardPage'))
const EnrollmentDetail = L(() => import('@/features/enrollments/EnrollmentDetailPage'))
const Structure = L(() => import('@/features/academic/StructurePage'))
const Years = L(() => import('@/features/academic/YearsPage'))
const Tuition = L(() => import('@/features/tuition/TuitionPage'))
const Payments = L(() => import('@/features/payments/PaymentsPage'))
const Accounts = L(() => import('@/features/accounts/AccountsPage'))
const Debts = L(() => import('@/features/debts/DebtsPage'))
const ReportsAcademic = L(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.AcademicReports })))
const ReportsEconomic = L(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.EconomicReports })))
const Operations = L(() => import('@/features/audit/OperationsPage'))
const Audit = L(() => import('@/features/audit/AuditPage'))
const Users = L(() => import('@/features/users/UsersPage'))
const Settings = L(() => import('@/features/settings/SettingsPage'))

const routes: RouteObject[] = [
  { path: '/login', element: <Login />, errorElement: <RouteError /> },
  {
    element: <RequireSession><AppLayout /></RequireSession>, errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'academico/estudiantes', element: <Students /> },
      { path: 'academico/estudiantes/:id', element: <StudentDetail /> },
      { path: 'academico/matriculas', element: <Enrollments /> },
      { path: 'academico/matriculas/nueva', element: <EnrollmentWizard /> },
      { path: 'academico/matriculas/:id', element: <EnrollmentDetail /> },
      { path: 'academico/estructura', element: <Structure /> },
      { path: 'academico/anios', element: <Years /> },
      { path: 'economico/mensualidades', element: <Tuition /> },
      { path: 'economico/pagos', element: <Payments /> },
      { path: 'economico/estados-cuenta', element: <Accounts /> },
      { path: 'economico/estados-cuenta/:studentId', element: <Accounts /> },
      { path: 'economico/deudas', element: <Debts /> },
      { path: 'reportes/academicos', element: <ReportsAcademic /> },
      { path: 'reportes/economicos', element: <ReportsEconomic /> },
      { path: 'reportes/operaciones', element: <Operations /> },
      { path: 'administracion/usuarios', element: <Users /> },
      { path: 'administracion/auditoria', element: <Audit /> },
      { path: 'administracion/configuracion', element: <Settings /> },
      { path: '*', element: <RouteError notFound /> },
    ],
  },
]
export const router = createBrowserRouter(routes)
