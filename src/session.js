import { auth } from './api.js';
import { signOutClerk } from './clerkAuth.js';

export async function signOut(navigate) {
  auth.clear();
  try {
    await signOutClerk();
  } catch {
    // Local sign-out must still succeed if Clerk is unavailable.
  }
  navigate('/login');
}
