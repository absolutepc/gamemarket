/** Staff role helpers — keep UI gates in sync with backend requireRole. */

export function isStaffAdmin(user) {
  return user?.role === 'admin' || user?.role === 'owner';
}

export function isPlatformOwner(user) {
  return user?.role === 'owner';
}
