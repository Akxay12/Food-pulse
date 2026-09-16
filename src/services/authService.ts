import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { UserProfile, UserRole } from '../types';

const STORAGE_USERS_KEY = 'foodcheck_local_users';
const STORAGE_CURRENT_KEY = 'foodcheck_current_session';

// Helper: Get local users stored in localStorage
function getLocalUsers(): Record<string, UserProfile & { password?: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Helper: Save local users
function saveLocalUsers(users: Record<string, UserProfile & { password?: string }>) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage quota errors
  }
}

// Helper: Map Firebase error codes to friendly messages
export function mapAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please log in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please verify and try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    default:
      return errorCode || 'Authentication failed. Please try again.';
  }
}

export const authService = {
  /**
   * Register a new user with Firebase Auth + Firestore profile
   */
  async signUp(params: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    phone?: string;
  }): Promise<UserProfile> {
    const { name, email, password, role = 'user', phone = '' } = params;

    // Validation
    if (!name || name.trim().length === 0) {
      throw new Error('Full Name is required.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && auth && db) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(cred.user, { displayName: cleanName });

        const newProfile: UserProfile = {
          uid: cred.user.uid,
          name: cleanName,
          email: cleanEmail,
          phone: phone.trim(),
          role,
          profileImage: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          createdAt: new Date().toISOString(),
          reviewsCount: 0
        };

        // Write user profile to Cloud Firestore: users/{uid}
        await setDoc(doc(db, 'users', cred.user.uid), newProfile);
        return newProfile;
      } catch (err: any) {
        throw new Error(mapAuthErrorMessage(err.code || err.message));
      }
    }

    // LOCAL FALLBACK PATH
    await new Promise((res) => setTimeout(res, 400));
    const localUsers = getLocalUsers();
    if (localUsers[cleanEmail]) {
      throw new Error('An account with this email already exists. Please log in instead.');
    }

    const uid = 'local-' + Date.now();
    const newProfile: UserProfile = {
      uid,
      name: cleanName,
      email: cleanEmail,
      phone: phone.trim(),
      role,
      profileImage: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString(),
      reviewsCount: 0
    };

    localUsers[cleanEmail] = { ...newProfile, password };
    saveLocalUsers(localUsers);
    localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(newProfile));
    return newProfile;
  },

  /**
   * Log in with Email & Password
   */
  async login(email: string, password: string): Promise<UserProfile> {
    if (!email || email.trim().length === 0) {
      throw new Error('Email is required.');
    }
    if (!password || password.length === 0) {
      throw new Error('Password is required.');
    }

    const cleanEmail = email.trim().toLowerCase();

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && auth && db) {
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const userDocRef = doc(db, 'users', cred.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          return userDoc.data() as UserProfile;
        } else {
          // Document doesn't exist yet, create default profile
          const defaultProfile: UserProfile = {
            uid: cred.user.uid,
            name: cred.user.displayName || cleanEmail.split('@')[0],
            email: cleanEmail,
            role: 'user',
            profileImage: cred.user.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
            createdAt: new Date().toISOString(),
            reviewsCount: 0
          };
          await setDoc(userDocRef, defaultProfile);
          return defaultProfile;
        }
      } catch (err: any) {
        throw new Error(mapAuthErrorMessage(err.code || err.message));
      }
    }

    // LOCAL FALLBACK PATH
    await new Promise((res) => setTimeout(res, 350));
    const localUsers = getLocalUsers();
    const existing = localUsers[cleanEmail];

    if (!existing) {
      // Auto-register demo account or check password
      const uid = 'local-' + Date.now();
      const profile: UserProfile = {
        uid,
        name: cleanEmail.split('@')[0].replace('.', ' '),
        email: cleanEmail,
        role: 'user',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
        reviewsCount: 0
      };
      localUsers[cleanEmail] = { ...profile, password };
      saveLocalUsers(localUsers);
      localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(profile));
      return profile;
    }

    if (existing.password && existing.password !== password) {
      throw new Error('Incorrect password. Please verify and try again.');
    }

    const { password: _, ...profile } = existing;
    localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(profile));
    return profile;
  },

  /**
   * Continue with Google Auth
   */
  async loginWithGoogle(selectedRole: UserRole = 'user'): Promise<UserProfile> {
    if (isFirebaseConfigured && auth && db) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          return userDoc.data() as UserProfile;
        } else {
          const newProfile: UserProfile = {
            uid: user.uid,
            name: user.displayName || 'FoodCheck User',
            email: user.email || '',
            role: selectedRole,
            profileImage: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            createdAt: new Date().toISOString(),
            reviewsCount: 0
          };
          await setDoc(userDocRef, newProfile);
          return newProfile;
        }
      } catch (err: any) {
        throw new Error(mapAuthErrorMessage(err.code || err.message));
      }
    }

    // Local Fallback
    await new Promise((res) => setTimeout(res, 300));
    const googleProfile: UserProfile = {
      uid: 'google-user-' + Date.now(),
      name: selectedRole === 'shopkeeper' ? 'Ramesh Gupta (Shree Snacks)' : 'Harshal Lad',
      email: selectedRole === 'shopkeeper' ? 'ramesh.snacks@foodcheck.test' : 'harshallad2007@gmail.com',
      role: selectedRole,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      reviewsCount: 24
    };
    localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(googleProfile));
    return googleProfile;
  },

  /**
   * Log out current session
   */
  async logout(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Firebase signOut error:', err);
      }
    }
    localStorage.removeItem(STORAGE_CURRENT_KEY);
  },

  /**
   * Listen to Auth state changes and sync user profile
   */
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    if (isFirebaseConfigured && auth && db) {
      return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              callback(userDoc.data() as UserProfile);
            } else {
              callback({
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                role: 'user',
                createdAt: new Date().toISOString(),
                reviewsCount: 0
              });
            }
          } catch {
            callback(null);
          }
        } else {
          callback(null);
        }
      });
    }

    // Local session restoration
    try {
      const stored = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (stored) {
        callback(JSON.parse(stored));
      } else {
        callback(null);
      }
    } catch {
      callback(null);
    }

    return () => {};
  }
};
