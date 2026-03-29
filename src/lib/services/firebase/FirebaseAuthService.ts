import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  type User,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/app/firebase';
import type { IAuthService } from '../IAuthService';
import type { ServiceUser, Unsubscribe } from '../types';
import { ServiceError } from '../types';

function toServiceUser(user: User): ServiceUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phoneNumber: user.phoneNumber,
  };
}

function toServiceError(err: unknown): ServiceError {
  if (err instanceof FirebaseError) {
    return new ServiceError(err.code, err.message);
  }
  if (err instanceof Error) {
    return new ServiceError('unknown', err.message);
  }
  return new ServiceError('unknown', String(err));
}

export class FirebaseAuthService implements IAuthService {
  get currentUser(): ServiceUser | null {
    const u = auth.currentUser;
    return u ? toServiceUser(u) : null;
  }

  async signIn(email: string, password: string): Promise<ServiceUser> {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return toServiceUser(cred.user);
    } catch (err) {
      throw toServiceError(err);
    }
  }

  async signUp(email: string, password: string): Promise<ServiceUser> {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return toServiceUser(cred.user);
    } catch (err) {
      throw toServiceError(err);
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      throw toServiceError(err);
    }
  }

  onAuthStateChanged(callback: (user: ServiceUser | null) => void): Unsubscribe {
    return firebaseOnAuthStateChanged(auth, (user) => {
      callback(user ? toServiceUser(user) : null);
    });
  }

  async updateProfile(updates: {
    displayName?: string | null;
    photoURL?: string | null;
  }): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new ServiceError('auth/no-current-user', 'No user is signed in.');
    try {
      await firebaseUpdateProfile(user, updates);
    } catch (err) {
      throw toServiceError(err);
    }
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email)
      throw new ServiceError('auth/no-current-user', 'No user is signed in.');
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await firebaseUpdatePassword(user, newPassword);
    } catch (err) {
      throw toServiceError(err);
    }
  }

  async deleteCurrentUser(password: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email)
      throw new ServiceError('auth/no-current-user', 'No user is signed in.');
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await deleteUser(user);
    } catch (err) {
      throw toServiceError(err);
    }
  }
}
