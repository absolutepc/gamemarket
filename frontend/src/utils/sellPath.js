import { isSellerAccount } from './accountTypes';

/** Path for sell CTAs depending on auth and account type */
export function sellPathForUser(user) {
  if (!user) return '/login';
  if (isSellerAccount(user)) return '/listings/create';
  return '/become-seller';
}
