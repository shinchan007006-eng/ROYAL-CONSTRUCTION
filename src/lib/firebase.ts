import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure Google OAuth Provider for Drive integrations
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive');

// In-memory token cache (strictly conforming to security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Export email-password Auth utilities
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile };

/**
 * Initialize Authentication listener. Call this on application mount.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If we have a user but no cached token (like on page refresh), 
        // they will need to click sign-in to re-acquire the Drive credential token
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Triggers Google Sign-In popup with Google Drive scopes and caches the token in-memory
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth credential');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign-in error occurred:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve the current in-memory cached OAuth access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out from session, purging in-memory access token
 */
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
