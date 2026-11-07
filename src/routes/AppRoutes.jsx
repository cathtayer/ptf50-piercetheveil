import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminRoutes from './AdminRoutes';
import ClientRoutes from './ClientRoutes';

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/*" element={<ClientRoutes />} />
      </Routes>
    </Router>
  );
}
