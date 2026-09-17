import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage, isFirebaseConfigured } from './firebase';
import { FoodShop, ShopDocument, MenuItem } from '../types';

const STORAGE_SHOPS_KEY = 'foodcheck_local_shops';

// Helper: Calculate distance between two coordinates in meters using Haversine formula
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Helper: Format meters to human readable distance string
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

function getLocalShops(): FoodShop[] {
  try {
    const raw = localStorage.getItem(STORAGE_SHOPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

function saveLocalShops(shops: FoodShop[]) {
  try {
    localStorage.setItem(STORAGE_SHOPS_KEY, JSON.stringify(shops));
  } catch {
    // Ignore
  }
}

export const shopService = {
  /**
   * Fetch all published FoodCheck registered shops for the shared map.
   * Strictly returns registered FoodCheck stalls from Firestore.
   */
  async getPublishedShops(userLocation?: { lat: number; lng: number } | null): Promise<FoodShop[]> {
    let shopsList: FoodShop[] = [];
    let firestoreQueried = false;

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && db) {
      try {
        console.info('[FoodCheck Maps] Firestore FoodCheck shop query started (shops collection, isPublished == true)...');
        const shopsRef = collection(db, 'shops');
        const q = query(shopsRef, where('isPublished', '==', true));
        const snapshot = await getDocs(q);
        firestoreQueried = true;

        if (!snapshot.empty) {
          shopsList = snapshot.docs
            .map((docSnap) => {
              const data = docSnap.data();
              const lat = Number(data.location?.latitude ?? data.latitude ?? data.lat);
              const lng = Number(data.location?.longitude ?? data.longitude ?? data.lng);

              // Exclude any shops without valid GPS coordinates
              if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
                return null;
              }

              return {
                id: data.shopId || docSnap.id,
                ownerId: data.ownerId,
                name: data.shopName || data.name || 'FoodCheck Stall',
                category: data.category || 'Street Food',
                imageUrl: data.shopImage || data.imageUrl || '',
                distance: '',
                distanceMeters: Infinity,
                rating: typeof data.rating === 'number' ? data.rating : 0,
                reviewsCount: typeof data.reviewsCount === 'number' ? data.reviewsCount : 0,
                isOpen: typeof data.isOpen === 'boolean' ? data.isOpen : true,
                isPublished: data.isPublished ?? true,
                isPopular: data.isPopular || false,
                openingTime: data.openingTime || '08:00 AM',
                closingTime: data.closingTime || '10:00 PM',
                foodQualityRating: typeof data.foodQualityRating === 'number' ? data.foodQualityRating : 0,
                hygieneRating: typeof data.hygieneRating === 'number' ? data.hygieneRating : 0,
                serviceRating: typeof data.serviceRating === 'number' ? data.serviceRating : 0,
                address: data.address || '',
                lat,
                lng,
                description: data.description || '',
                menuCardImage: data.menuImage || data.menuCardImage || '',
                menuItems: Array.isArray(data.menuItems) ? data.menuItems : [],
                reviews: Array.isArray(data.reviews) ? data.reviews : [],
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
              } as FoodShop;
            })
            .filter((s): s is FoodShop => s !== null);
        }
        console.info('[FoodCheck Maps] Firestore FoodCheck shop query completed. Number of FoodCheck shops returned:', shopsList.length);
      } catch (err) {
        console.warn('[FoodCheck Maps] Failed to fetch published shops from Firestore, checking local storage:', err);
      }
    }

    // Only fallback to local storage if Firestore was NOT queried (e.g. offline/error)
    if (!firestoreQueried) {
      shopsList = getLocalShops();
      console.info('[FoodCheck Maps] Local storage FoodCheck shops count:', shopsList.length);
    }

    // Compute dynamic distance if userLocation provided
    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      shopsList = shopsList.map((shop) => {
        const distMeters = calculateDistanceMeters(
          userLocation.lat,
          userLocation.lng,
          shop.lat,
          shop.lng
        );
        return {
          ...shop,
          distanceMeters: distMeters,
          distance: formatDistance(distMeters)
        };
      });
      // Sort nearest first
      shopsList.sort((a, b) => a.distanceMeters - b.distanceMeters);
    }

    return shopsList;
  },

  /**
   * Filter shops by selected radius (500m, 1km, 2km, 5km)
   */
  filterByRadius(shops: FoodShop[], radiusMeters: number): FoodShop[] {
    return shops.filter((s) => s.distanceMeters <= radiusMeters);
  },

  /**
   * Get a single shop by ID
   */
  async getShopById(shopId: string): Promise<FoodShop | null> {
    if (isFirebaseConfigured && db) {
      try {
        const shopRef = doc(db, 'shops', shopId);
        const snapshot = await getDoc(shopRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const lat = Number(data.latitude ?? data.lat);
          const lng = Number(data.longitude ?? data.lng);

          return {
            id: data.shopId || snapshot.id,
            ownerId: data.ownerId,
            name: data.shopName || data.name || 'FoodCheck Stall',
            category: data.category || 'Street Food',
            imageUrl: data.shopImage || data.imageUrl || '',
            distance: '',
            distanceMeters: 0,
            rating: typeof data.rating === 'number' ? data.rating : 0,
            reviewsCount: typeof data.reviewsCount === 'number' ? data.reviewsCount : 0,
            isOpen: data.isOpen ?? true,
            isPublished: data.isPublished ?? true,
            isPopular: data.isPopular || false,
            openingTime: data.openingTime || '08:00 AM',
            closingTime: data.closingTime || '10:00 PM',
            foodQualityRating: typeof data.foodQualityRating === 'number' ? data.foodQualityRating : 0,
            hygieneRating: typeof data.hygieneRating === 'number' ? data.hygieneRating : 0,
            serviceRating: typeof data.serviceRating === 'number' ? data.serviceRating : 0,
            address: data.address || '',
            lat: isNaN(lat) ? 0 : lat,
            lng: isNaN(lng) ? 0 : lng,
            description: data.description || '',
            menuCardImage: data.menuImage || data.menuCardImage || '',
            menuItems: Array.isArray(data.menuItems) ? data.menuItems : [],
            reviews: Array.isArray(data.reviews) ? data.reviews : [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
        }
      } catch (err) {
        console.warn('Failed to get shop from Firestore:', err);
      }
    }

    const local = getLocalShops();
    return local.find((s) => s.id === shopId) || null;
  },

  /**
   * Upload actual shopkeeper photos (stall photo or menu card) to Firebase Storage
   * bucket path: shops/{ownerId}/{type}_{timestamp}.{ext}
   */
  async uploadShopMedia(
    fileOrDataUrl: File | Blob | string,
    ownerId: string,
    type: 'stall' | 'menu'
  ): Promise<string> {
    const effectiveOwnerId = auth?.currentUser?.uid || ownerId || 'user';

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

    if (isFirebaseConfigured && storage) {
      try {
        const timestamp = Date.now();
        const rawName = (fileOrDataUrl as File).name || `${type}_photo.jpg`;
        const ext = rawName.split('.').pop() || 'jpg';
        const cleanName = `${type}_${timestamp}.${ext}`;
        const path = `shops/${effectiveOwnerId}/${cleanName}`;
        const storageRef = ref(storage, path);

        await uploadBytes(storageRef, fileBlob, { contentType });
        const downloadUrl = await getDownloadURL(storageRef);
        console.info(`[FoodCheck Storage] Uploaded ${type} image successfully:`, downloadUrl);
        return downloadUrl;
      } catch (err: any) {
        console.error(`[FoodCheck Storage] Firebase Storage upload error for ${type}:`, err);
        throw new Error(err?.message ? `Failed to upload image: ${err.message}` : 'Failed to upload image to storage.');
      }
    }

    // Fallback: Read as data URL from user's file so it's their real image
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.readAsDataURL(fileBlob);
    });
  },

  /**
   * Create and register a new Shopkeeper Shop in Firestore: shops/{shopId}
   */
  async createShop(params: {
    ownerId: string;
    shopName: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    openingTime: string;
    closingTime: string;
    shopImage: string;
    menuImage?: string;
    address: string;
    menuItems?: MenuItem[];
  }): Promise<FoodShop> {
    if (!params.ownerId) throw new Error('Authenticated shopkeeper required.');
    if (!params.shopName?.trim()) throw new Error('Shop name is required.');
    if (!params.category?.trim()) throw new Error('Food category is required.');

    const shopId = 'shop-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const shopDoc: any = {
      shopId,
      ownerId: params.ownerId,
      shopName: params.shopName.trim(),
      category: params.category.trim(),
      description: params.description.trim(),
      latitude: params.latitude,
      longitude: params.longitude,
      location: {
        latitude: params.latitude,
        longitude: params.longitude
      },
      openingTime: params.openingTime || '08:00 AM',
      closingTime: params.closingTime || '10:00 PM',
      shopImage: params.shopImage || '',
      menuImage: params.menuImage || '',
      isPublished: true,
      isOpen: true,
      rating: 0,
      reviewsCount: 0,
      foodQualityRating: 0,
      hygieneRating: 0,
      serviceRating: 0,
      address: params.address || '',
      menuItems: params.menuItems || [],
      createdAt: now,
      updatedAt: now
    };

    const newShop: FoodShop = {
      id: shopId,
      ownerId: params.ownerId,
      name: shopDoc.shopName,
      category: shopDoc.category,
      imageUrl: shopDoc.shopImage,
      distance: '',
      distanceMeters: 0,
      rating: 0,
      reviewsCount: 0,
      isOpen: true,
      isPublished: true,
      isPopular: false,
      openingTime: shopDoc.openingTime,
      closingTime: shopDoc.closingTime,
      foodQualityRating: 0,
      hygieneRating: 0,
      serviceRating: 0,
      address: shopDoc.address,
      lat: shopDoc.latitude,
      lng: shopDoc.longitude,
      description: shopDoc.description,
      menuCardImage: shopDoc.menuImage,
      menuItems: shopDoc.menuItems,
      reviews: [],
      createdAt: now,
      updatedAt: now
    };

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && db) {
      try {
        const shopRef = doc(db, 'shops', shopId);
        await setDoc(shopRef, shopDoc);
        console.info('[FoodCheck] Shop registered in Firestore:', shopId);
        return newShop;
      } catch (err) {
        console.warn('Failed to write shop to Firestore, saving locally:', err);
      }
    }

    // LOCAL FALLBACK PATH
    const local = getLocalShops();
    local.unshift(newShop);
    saveLocalShops(local);
    localStorage.setItem(`foodcheck_shop_${params.ownerId}`, JSON.stringify(newShop));
    return newShop;
  },

  /**
   * Update shop details (only by owner)
   */
  async updateShop(
    shopId: string,
    updates: Partial<FoodShop>,
    ownerId: string
  ): Promise<FoodShop> {
    if (!ownerId) throw new Error('Authentication required.');

    const now = new Date().toISOString();

    if (isFirebaseConfigured && db) {
      try {
        const shopRef = doc(db, 'shops', shopId);
        const snap = await getDoc(shopRef);
        if (snap.exists()) {
          const existing = snap.data();
          if (existing.ownerId !== ownerId) {
            throw new Error('Only the shop owner can edit this shop.');
          }
          await updateDoc(shopRef, {
            ...updates,
            updatedAt: now
          });
        }
      } catch (err: any) {
        console.warn('Failed to update shop in Firestore:', err);
      }
    }

    const local = getLocalShops();
    const index = local.findIndex((s) => s.id === shopId);
    if (index !== -1) {
      if (local[index].ownerId && local[index].ownerId !== ownerId) {
        throw new Error('Only the shop owner can edit this shop.');
      }
      local[index] = { ...local[index], ...updates, updatedAt: now };
      saveLocalShops(local);
      localStorage.setItem(`foodcheck_shop_${ownerId}`, JSON.stringify(local[index]));
      return local[index];
    }

    throw new Error('Shop not found.');
  },

  /**
   * Toggle Shop Open / Closed status
   */
  async toggleShopStatus(shopId: string, ownerId: string): Promise<boolean> {
    const shop = await this.getShopById(shopId);
    if (!shop) throw new Error('Shop not found.');
    const nextStatus = !shop.isOpen;
    await this.updateShop(shopId, { isOpen: nextStatus }, ownerId);
    return nextStatus;
  },

  /**
   * Create or update shop seamlessly
   */
  async createOrUpdateShop(shop: FoodShop): Promise<FoodShop> {
    const existing = await this.getShopById(shop.id);
    if (existing) {
      return await this.updateShop(shop.id, shop, shop.ownerId || 'owner-sample-1');
    }
    return await this.createShop({
      ownerId: shop.ownerId || 'owner-sample-1',
      shopName: shop.name,
      category: shop.category,
      description: shop.description || '',
      latitude: typeof shop.lat === 'number' ? shop.lat : 0,
      longitude: typeof shop.lng === 'number' ? shop.lng : 0,
      openingTime: shop.openingTime || '08:00 AM',
      closingTime: shop.closingTime || '10:00 PM',
      shopImage: shop.imageUrl,
      menuImage: shop.menuCardImage,
      address: shop.address,
      menuItems: shop.menuItems
    });
  }
};

