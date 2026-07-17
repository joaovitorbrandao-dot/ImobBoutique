import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuses the same Firebase project as the sibling Stegion-LOW app — this
// project only ever issues Google OAuth tokens (Drive/Calendar scopes), it
// never touches app data, so sharing it across both apps is safe.
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/calendar');

const TOKEN_KEY = 'imobboutique_google_access_token';
const TOKEN_ISSUED_AT_KEY = 'imobboutique_google_access_token_issued_at';
const TOKEN_LIFETIME_MS = 55 * 60 * 1000; // Google access tokens last ~1h; refresh a bit early

let isSigningIn = false;

// Persist the Google access token across reloads (and independent of the
// app's own Supabase login/logout) so the Agenda connection only drops when
// the user explicitly disconnects or the token actually expires.
const readPersistedToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const issuedAt = Number(localStorage.getItem(TOKEN_ISSUED_AT_KEY) || 0);
  if (!token || !issuedAt) return null;
  if (Date.now() - issuedAt > TOKEN_LIFETIME_MS) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_ISSUED_AT_KEY);
    return null;
  }
  return token;
};

let cachedAccessToken: string | null = readPersistedToken();

const persistToken = (token: string) => {
  cachedAccessToken = token;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_ISSUED_AT_KEY, String(Date.now()));
};

const clearPersistedToken = () => {
  cachedAccessToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_ISSUED_AT_KEY);
};

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || readPersistedToken();
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível recuperar o Token de Acesso do Google Auth');
    }
    persistToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Erro de Login Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || readPersistedToken();
};

// Explicit disconnect only — this must never be called from the app's own
// logout, and the app's own logout must never end up here.
export const googleDisconnect = async () => {
  await auth.signOut();
  clearPersistedToken();
};
