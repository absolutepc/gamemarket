import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { saveFoundersInvite, FOUNDERS_REGISTER_PATH } from '../utils/foundersInvite';
import useAuthStore from '../store/authStore';

/**
 * Pretty invite URL: /invite/founders
 * Guests → registration as seller (Founders context)
 * Logged-in users → Founders application page
 */
export default function FoundersInviteRedirect() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    saveFoundersInvite();
  }, []);

  if (user) {
    return <Navigate to="/founders" replace />;
  }

  return <Navigate to={FOUNDERS_REGISTER_PATH} replace />;
}
