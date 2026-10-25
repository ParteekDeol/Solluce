import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { fieldDocument } from '../../shared/fieldStorage';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const firebaseReady = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
const app = firebaseReady ? initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
export const googleSignIn = () => signInWithPopup(auth, new GoogleAuthProvider());
export const logOut = () => signOut(auth);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);
export async function emailSignIn(email, password, name) {
  if (!name) return signInWithEmailAndPassword(auth, email, password);
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  return result;
}
export function subscribeRecords(uid, type, onData, onError) {
  return onSnapshot(collection(db, 'users', uid, type), snapshot => {
    onData(snapshot.docs.map(item => ({ ...item.data(), id: item.id })).sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
  }, onError);
}
export async function saveField(uid, field) {
  const id = field.id && !field.id.startsWith('sample') ? field.id : crypto.randomUUID();
  const clean = fieldDocument(field, id);
  await setDoc(doc(db, 'users', uid, 'fields', id), clean);
  return clean;
}
export const removeField = (uid, id) => deleteDoc(doc(db, 'users', uid, 'fields', id));
export async function saveAnalysis(uid, analysis) {
  // Photos stay in memory and are sent to Gemini, never stored in Firestore.
  const { photoPreviews, ...record } = analysis;
  await setDoc(doc(db, 'users', uid, 'analyses', record.id), record);
}
export const saveCompleted = (uid, id, completed) => updateDoc(doc(db, 'users', uid, 'analyses', id), { completed });
export function authError(error) {
  const messages = {
    'auth/popup-closed-by-user': 'Sign-in was closed. You can try again or continue as a guest.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow popups or use email sign-in.',
    'auth/unauthorized-domain': 'This domain needs to be added to Firebase Authentication’s authorized domains.',
    'auth/operation-not-allowed': 'Enable this sign-in provider in Firebase Authentication.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/email-already-in-use': 'That email already has an account. Choose Sign in.',
    'auth/weak-password': 'Use a password with at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Check your internet connection and try again.',
    'auth/invalid-email': 'Enter a valid email address.',
  };
  return messages[error.code] || 'Sign-in could not be completed. Check the Firebase setup and try again.';
}
