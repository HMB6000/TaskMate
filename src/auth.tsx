import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, firebaseConfigured } from "./firebase";
import { createUserProfile } from "./remote";

interface AuthValue {
  /** Signed-in Firebase user, or null. */
  user: User | null;
  /** True until Firebase has restored (or ruled out) a saved session. */
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value: AuthValue = {
    user,
    loading,
    async signUp(name, email, password) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await createUserProfile(cred.user.uid, name, email);
      // Non-blocking: people can use the app straight away, but get a verification email.
      sendEmailVerification(cred.user).catch(() => {});
    },
    async signIn(email, password) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signOut() {
      await fbSignOut(auth);
    },
    async resetPassword(email) {
      await sendPasswordResetEmail(auth, email);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx)!;

/** Turns Firebase error codes into plain, friendly sentences. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password don't match an account. Check them and try again.";
    case "auth/email-already-in-use":
      return "There's already an account with this email. Try signing in instead.";
    case "auth/weak-password":
      return "Please choose a stronger password (at least 6 characters).";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled in your Firebase Console. Go to Firebase Console > Authentication > Sign-in method and enable Email/Password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "We couldn't reach the server. Check your internet connection.";
    default:
      return (err as { message?: string })?.message || "Something went wrong. Please try again.";
  }
}
