import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './Layout';
import Dashboard from '@/features/dashboard/Dashboard';
import Estudiantes from '@/features/students/Estudiantes';
import Matriculas from '@/features/enrollments/Matriculas';
import Pagos from '@/features/payments/Pagos';
import Deudas from '@/features/debts/Deudas';
import Auditoria from '@/features/audit/Auditoria';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="estudiantes" element={<Estudiantes />} />
          <Route path="matriculas" element={<Matriculas />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="deudas" element={<Deudas />} />
          <Route path="auditoria" element={<Auditoria />} />
          <Route path="*" element={<p className="p-10 text-center text-muted">Página no encontrada</p>} />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}
