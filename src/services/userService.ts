import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
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
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, updates as any);
        return;
      } catch (err) {
        console.warn('Error updating profile in Firestore:', err);
      }
    }

    // Local fallback
    try {
      const stored = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (stored) {
        const user = JSON.parse(stored) as UserProfile;
        if (user.uid === uid) {
          const updated = { ...user, ...updates };
          localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(updated));
        }
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
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, {
          reviewsCount: increment(delta)
        });
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
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, {
          videosCount: increment(delta)
        });
        const snap = await getDoc(ref);
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
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, {
          helpfulLikesReceived: totalLikes
        });
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
  async uploadAvatar(file: File | Blob, userId: string): Promise<string> {
    if (isFirebaseConfigured && storage && userId) {
      try {
        const timestamp = Date.now();
        const rawName = (file as File).name || 'avatar.jpg';
        const ext = rawName.split('.').pop() || 'jpg';
        const path = `avatars/${userId}/avatar_${timestamp}.${ext}`;
        const storageRef = ref(storage, path);
        const contentType = file.type || 'image/jpeg';
        await uploadBytes(storageRef, file, { contentType });
        const downloadUrl = await getDownloadURL(storageRef);

        await this.updateUserProfile(userId, { profileImage: downloadUrl });

        if (auth?.currentUser) {
          try {
            await updateProfile(auth.currentUser, { photoURL: downloadUrl });
          } catch {
            // Ignore auth profile update failure
          }
        }
        return downloadUrl;
      } catch (err) {
        console.warn('Error uploading avatar to Firebase Storage:', err);
      }
    }

    // Local fallback: FileReader data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const url = (e.target?.result as string) || '';
        await this.updateUserProfile(userId, { profileImage: url });
        resolve(url);
      };
      reader.readAsDataURL(file);
    });
  }
};
