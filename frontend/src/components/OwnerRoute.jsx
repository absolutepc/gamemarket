import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isPlatformOwner } from '../utils/roles';

/** Finance / treasury — platform owner only. */
export default function OwnerRoute() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!isPlatformOwner(user)) return <Navigate to="/admin/stats" replace />;
  return <Outlet />;
}
