import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isStaffAdmin } from '../utils/roles';

export default function AdminRoute() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaffAdmin(user)) return <Navigate to="/" replace />;
  return <Outlet />;
}
