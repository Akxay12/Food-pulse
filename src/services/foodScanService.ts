import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { FoodScanResult, FoodScanDocument } from '../types';
import { INITIAL_RECENT_SCANS } from '../data/mockData';

const STORAGE_SCANS_KEY = 'foodcheck_local_scans';

function getLocalScans(userId?: string): FoodScanResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_SCANS_KEY);
    if (raw) {
      const allScans = JSON.parse(raw) as FoodScanResult[];
      if (userId) {
        return allScans.filter((s) => !s.userId || s.userId === userId);
      }
      return allScans;
    }
  } catch {
    // Ignore
  }

  const initial = INITIAL_RECENT_SCANS.map((s) => ({
    ...s,
    userId: userId || 'local-default-user'
  }));
  saveLocalScans(initial);
  return initial;
}

function saveLocalScans(scans: FoodScanResult[]) {
  try {
    localStorage.setItem(STORAGE_SCANS_KEY, JSON.stringify(scans));
  } catch {
    // Ignore
  }
}

export const foodScanService = {
  /**
   * Save completed scan to Firestore: foodScans/{scanId}
   */
  async saveScan(scanResult: FoodScanResult, userId: string): Promise<FoodScanResult> {
    const scanId = scanResult.id || 'scan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const scanDoc: FoodScanDocument = {
      ...scanResult,
      id: scanId,
      scanId,
      userId: userId || 'guest-user',
      createdAt: now
    };

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && db && userId && userId !== 'guest-user') {
      try {
        const scanRef = doc(db, 'foodScans', scanId);
        await setDoc(scanRef, scanDoc);
        console.info('[FoodCheck] Scan saved to Firestore:', scanId);
        return scanDoc;
      } catch (err) {
        console.warn('Failed to save food scan in Firestore, saving locally:', err);
      }
    }

    // LOCAL FALLBACK PATH
    const local = getLocalScans();
    const updated = [scanDoc, ...local.filter((s) => s.id !== scanId)];
    saveLocalScans(updated);
    return scanDoc;
  },

  /**
   * Fetch private scan history for the logged-in user
   */
  async getUserScans(userId: string): Promise<FoodScanResult[]> {
    if (!userId) return getLocalScans();

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && db) {
      try {
        const scansRef = collection(db, 'foodScans');
        const q = query(
          scansRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs.map((docSnap) => docSnap.data() as FoodScanResult);
        }
      } catch (err) {
        console.warn('Failed to fetch scans from Firestore, using local data:', err);
      }
    }

    return getLocalScans(userId);
  }
};
