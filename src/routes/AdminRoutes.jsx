import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import Appointments from '../pages/admin/Appointments';
import ScheduleManagement from '../pages/admin/ScheduleManagement';
import ServicesManagement from '../pages/admin/ServicesManagement';
import JewelryManagement from '../pages/admin/JewelryManagement';
import CustomerManagement from '../pages/admin/CustomerManagement';
import Login from '../pages/admin/Login';

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Standalone Login Route */}
      <Route path="login" element={<Login />} />
      <Route element={<ProtectedRoute requireAdmin />}>
        <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="schedule" element={<ScheduleManagement />} />
        <Route path="services" element={<ServicesManagement />} />
        <Route path="jewelry" element={<JewelryManagement />} />
        <Route path="customers" element={<CustomerManagement />} />
        </Route>
      </Route>
    </Routes>
  );
}