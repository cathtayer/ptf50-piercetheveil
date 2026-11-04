import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminRoutes from './AdminRoutes';
import Home from '../pages/client/Home';
import Appointment from '../pages/client/Appointment';

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/availability" element={<Appointment />} />
        <Route path="/*" element={<Home />} />
      </Routes>
    </Router>
  );
}
