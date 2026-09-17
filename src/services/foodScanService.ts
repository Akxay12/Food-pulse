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
        return allScans.filter((s) => s.userId === userId);
      }
      return allScans;
    }
  } catch {
    // Ignore
  }
  return [];
}

function saveLocalScans(scans: FoodScanResult[]) {
  try {
    const trimmed = scans.slice(0, 15);
    localStorage.setItem(STORAGE_SCANS_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('[FoodCheck LocalScans] localStorage write warning:', err);
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
        // Simple query without compound index requirement
        const q = query(
          scansRef,
          where('userId', '==', userId),
          limit(30)
        );
        const snapshot = await getDocs(q);
        const scans: FoodScanResult[] = snapshot.docs.map((docSnap) => docSnap.data() as FoodScanResult);
        
        // Sort descending by date in memory
        scans.sort((a, b) => {
          const timeA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
          const timeB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
          return timeB - timeA;
        });

        return scans;
      } catch (err) {
        console.warn('Failed to fetch scans from Firestore, using local data:', err);
      }
    }

    return getLocalScans(userId);
  }
};
