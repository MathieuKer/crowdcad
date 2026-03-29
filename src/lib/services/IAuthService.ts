import type { ServiceUser, Unsubscribe } from './types';

export interface IAuthService {
  signIn(email: string, password: string): Promise<ServiceUser>;
  signUp(email: string, password: string): Promise<ServiceUser>;
  signOut(): Promise<void>;

  /** Subscribe to auth state changes. Fires immediately with the current user. */
  onAuthStateChanged(callback: (user: ServiceUser | null) => void): Unsubscribe;

  updateProfile(updates: { displayName?: string | null; photoURL?: string | null }): Promise<void>;

  /** Re-authenticates with currentPassword before setting the new one. */
  updatePassword(currentPassword: string, newPassword: string): Promise<void>;

  /** Re-authenticates with password before permanently deleting the account. */
  deleteCurrentUser(password: string): Promise<void>;

  /** Synchronous access to the current user (null if not signed in or not yet resolved). */
  readonly currentUser: ServiceUser | null;
}
