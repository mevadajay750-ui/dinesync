import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
  type Unsubscribe,
} from "firebase/auth";
import { getFirebaseAuth } from "./config";

const auth = getFirebaseAuth();

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName?.trim() && cred.user) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: FirebaseUser | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export { auth };
