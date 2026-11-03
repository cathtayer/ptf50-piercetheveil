import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminRoutes from './AdminRoutes';
import Home from '../pages/client/Home';

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/*" element={<Home />} />
      </Routes>
    </Router>
  );
}