import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import RequireAdmin from './components/auth/RequireAdmin.jsx';
import Home from './pages/Home.jsx';
import Browse from './pages/Browse.jsx';
import MovieDetail from './pages/MovieDetail.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import NotFound from './pages/NotFound.jsx';

/**
 * Route table.
 * Guest screens (/, /browse, /movies/:id) are public; everything under /admin
 * is wrapped in RequireAdmin except the sign-in screen itself.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/movies" element={<Navigate to="/browse" replace />} />
        <Route path="/movies/:id" element={<MovieDetail />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}