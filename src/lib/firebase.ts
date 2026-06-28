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
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Configure Google OAuth Provider for general logins (zero sensitive scopes = no unverified blocks)
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});

// Configure Google OAuth Provider for specialized Drive/Sheets integrations
// We use 'drive.file' scope instead of the restricted 'drive' scope.
// This prevents Google's hard "Access Blocked" screen, allowing ANY Gmail account to bypass
// the verification prompt by clicking "Advanced" -> "Go to Onsite Build-Pro (unsafe)"!
export const googleDriveProvider = new GoogleAuthProvider();
googleDriveProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleDriveProvider.setCustomParameters({
  prompt: 'select_account'
});

// Cache token in localStorage for persistence across logins/reloads
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('bt_google_drive_access_token') : null;
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
      if (!cachedAccessToken && typeof window !== 'undefined') {
        cachedAccessToken = localStorage.getItem('bt_google_drive_access_token');
      }
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If we have a user but no cached token (like on page refresh), 
        // they will need to click sign-in to re-acquire the Drive credential token
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bt_google_drive_access_token');
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Triggers standard Google Sign-In with NO extra scopes. This is unblocked and safe for all users.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    // Standard credential token
    const token = credential?.accessToken || '';
    return { user: result.user, accessToken: token };
  } catch (error) {
    console.error('Standard Sign-in error occurred:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Triggers Google Sign-In popup with Google Drive and Sheets scopes for backup and sync integrations
 */
export const googleSignInWithDrive = async (email?: string): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    if (email) {
      googleDriveProvider.setCustomParameters({
        prompt: 'select_account',
        login_hint: email
      });
    } else {
      googleDriveProvider.setCustomParameters({
        prompt: 'select_account'
      });
    }
    const result = await signInWithPopup(auth, googleDriveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth credential with Drive scopes');
    }

    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bt_google_drive_access_token', cachedAccessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Drive Sign-in error occurred:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve the current in-memory cached OAuth access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken && typeof window !== 'undefined') {
    cachedAccessToken = localStorage.getItem('bt_google_drive_access_token');
  }
  return cachedAccessToken;
};

/**
 * Sign out from session, purging in-memory access token
 */
export const logout = async () => {
  localStorage.removeItem('bt_workspace_owner_id');
  localStorage.removeItem('bt_sub_user');
  localStorage.removeItem('bt_offline_mode');
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bt_google_drive_access_token');
  }
  await signOut(auth);
  cachedAccessToken = null;
};

// --- Firestore Diagnostic Error Handling helpers ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

