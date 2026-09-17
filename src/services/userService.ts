import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { auth, db, storage, isFirebaseConfigured } from './firebase';
import { UserProfile } from '../types';

const STORAGE_USERS_KEY = 'foodcheck_local_users';
const STORAGE_CURRENT_KEY = 'foodcheck_current_session';

export const userService = {
  /**
   * Fetch user profile from Firestore users/{uid}
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured && db) {
      try {
        const ref = doc(db, 'users', uid);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          return snapshot.data() as UserProfile;
        }
      } catch (err) {
        console.warn('Error fetching user profile from Firestore:', err);
      }
    }

    // Local fallback
    try {
      const stored = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (stored) {
        const user = JSON.parse(stored) as UserProfile;
        if (user.uid === uid) return user;
      }
      const allUsers = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '{}');
      for (const key of Object.keys(allUsers)) {
        if (allUsers[key].uid === uid) return allUsers[key];
      }
    } catch {
      // Ignore
    }
    return null;
  },

  /**
   * Update user profile fields in Firestore
   */
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, updates as any, { merge: true });
      } catch (err) {
        console.warn('Error updating profile in Firestore:', err);
      }
    }

    // Local fallback and local cache update
    try {
      const stored = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (stored) {
        const user = JSON.parse(stored) as UserProfile;
        if (user.uid === uid) {
          const updated = { ...user, ...updates };
          localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(updated));
        }
      }
      const allUsers = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '{}');
      if (allUsers[uid]) {
        allUsers[uid] = { ...allUsers[uid], ...updates };
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(allUsers));
      }
    } catch {
      // Ignore
    }
  },

  /**
   * Check if a shopkeeper has completed their shop setup (Module 1G)
   */
  async getShopkeeperStatus(uid: string): Promise<{ hasSetupShop: boolean; shopName?: string }> {
    const stored = localStorage.getItem(`foodcheck_shop_${uid}`);
    if (stored) {
      try {
        const shop = JSON.parse(stored);
        return { hasSetupShop: true, shopName: shop.name };
      } catch {
        return { hasSetupShop: false };
      }
    }
    return { hasSetupShop: false };
  },

  /**
   * Increment or decrement reviews count in user profile
   */
  async incrementUserReviewCount(uid: string, delta: number = 1): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, { reviewsCount: increment(delta) }, { merge: true });
        return;
      } catch (err) {
        console.warn('Failed to increment user review count in Firestore:', err);
      }
    }

    // Local fallback
    try {
      const stored = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (stored) {
        const user = JSON.parse(stored) as UserProfile;
        user.reviewsCount = Math.max(0, (user.reviewsCount || 0) + delta);
        localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(user));
      }
    } catch {
      // Ignore
    }
  },

  /**
   * Increment or decrement video count in user profile
   */
  async incrementUserVideoCount(uid: string, delta: number = 1): Promise<number> {
    let nextCount = 0;
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, { videosCount: increment(delta) }, { merge: true });
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          nextCount = snap.data().videosCount || 0;
        }
      } catch (err) {
        console.warn('Failed to increment user video count in Firestore:', err);
      }
    }

    // Local fallback
    try {
      const stored = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (stored) {
        const user = JSON.parse(stored) as UserProfile;
        user.videosCount = Math.max(0, (user.videosCount || 0) + delta);
        nextCount = user.videosCount;
        localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(user));
      }
    } catch {
      // Ignore
    }
    return nextCount;
  },

  /**
   * Update helpful likes received count for user
   */
  async updateHelpfulLikesReceived(uid: string, totalLikes: number): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, { helpfulLikesReceived: totalLikes }, { merge: true });
      } catch (err) {
        console.warn('Failed to update helpful likes in Firestore:', err);
      }
    }

    // Local fallback
    try {
      const stored = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (stored) {
        const user = JSON.parse(stored) as UserProfile;
        user.helpfulLikesReceived = totalLikes;
        localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(user));
      }
    } catch {
      // Ignore
    }
  },

  /**
   * Upload real profile photo to Firebase Storage avatars/{userId} and update profile
   */
  async uploadAvatar(fileOrDataUrl: File | Blob | string, userId: string): Promise<string> {
    const effectiveUid = auth?.currentUser?.uid || userId;
    if (!effectiveUid) {
      throw new Error('You must be logged in to upload a profile picture.');
    }

    let fileBlob: Blob;
    let contentType = 'image/jpeg';
    if (typeof fileOrDataUrl === 'string') {
      const parts = fileOrDataUrl.split(',');
      if (parts.length > 1 && parts[0].includes('base64')) {
        const mimeMatch = parts[0].match(/:(.*?);/);
        contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        fileBlob = new Blob([u8arr], { type: contentType });
      } else {
        const res = await fetch(fileOrDataUrl);
        fileBlob = await res.blob();
        contentType = fileBlob.type || 'image/jpeg';
      }
    } else {
      fileBlob = fileOrDataUrl;
      contentType = fileOrDataUrl.type || 'image/jpeg';
    }

    // LIVE FIREBASE STORAGE PATH
    if (isFirebaseConfigured && storage) {
      try {
        const timestamp = Date.now();
        const rawName = (fileOrDataUrl as File).name || 'avatar.jpg';
        const ext = rawName.includes('.') ? rawName.split('.').pop() || 'jpg' : 'jpg';
        const path = `avatars/${effectiveUid}/avatar_${timestamp}.${ext}`;
        const storageRef = ref(storage, path);

        await uploadBytes(storageRef, fileBlob, { contentType });
        const downloadUrl = await getDownloadURL(storageRef);

        await this.updateUserProfile(effectiveUid, { profileImage: downloadUrl });

        if (auth?.currentUser) {
          try {
            await updateProfile(auth.currentUser, { photoURL: downloadUrl });
          } catch {
            // Ignore auth profile update failure
          }
        }
        return downloadUrl;
      } catch (err: any) {
        console.error('Error uploading avatar to Firebase Storage:', err);
        throw new Error(err?.message ? `Failed to upload profile photo: ${err.message}` : 'Failed to upload profile photo. Please check your network and try again.');
      }
    }

    // Local fallback: FileReader data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const url = (e.target?.result as string) || '';
        await this.updateUserProfile(effectiveUid, { profileImage: url });
        resolve(url);
      };
      reader.onerror = () => reject(new Error('Failed to process image file.'));
      reader.readAsDataURL(fileBlob);
    });
  }
};
