import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isSellerAccount } from '../utils/accountTypes';

/** Requires auth + seller account_type (or admin). */
export default function SellerRoute() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!isSellerAccount(user)) return <Navigate to="/become-seller" replace />;
  return <Outlet />;
}
