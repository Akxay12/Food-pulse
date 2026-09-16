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
import { db, isFirebaseConfigured } from './firebase';
import { FoodShop, ShopDocument, MenuItem } from '../types';
import { INITIAL_SHOPS } from '../data/mockData';

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

  const initial = INITIAL_SHOPS.map((s) => ({
    ...s,
    isPublished: true,
    ownerId: s.ownerId || 'owner-sample-1'
  }));
  saveLocalShops(initial);
  return initial;
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
   * Fetch all published FoodCheck registered shops for the shared map
   */
  async getPublishedShops(userLocation?: { lat: number; lng: number }): Promise<FoodShop[]> {
    let shopsList: FoodShop[] = [];

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && db) {
      try {
        const shopsRef = collection(db, 'shops');
        const q = query(shopsRef, where('isPublished', '==', true));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          shopsList = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: data.shopId || docSnap.id,
              ownerId: data.ownerId,
              name: data.shopName || data.name,
              category: data.category,
              imageUrl: data.shopImage || data.imageUrl,
              distance: '0.5 km',
              distanceMeters: 500,
              rating: data.rating || 4.5,
              isOpen: typeof data.isOpen === 'boolean' ? data.isOpen : true,
              isPublished: data.isPublished,
              isPopular: data.isPopular || false,
              openingTime: data.openingTime || '08:00 AM',
              closingTime: data.closingTime || '10:00 PM',
              foodQualityRating: data.foodQualityRating || 4.6,
              hygieneRating: data.hygieneRating || 4.5,
              serviceRating: data.serviceRating || 4.4,
              address: data.address || 'Local Street Food Area',
              lat: data.latitude || data.lat || 19.0178,
              lng: data.longitude || data.lng || 72.8478,
              description: data.description || '',
              menuCardImage: data.menuImage || data.menuCardImage,
              menuItems: data.menuItems || [],
              reviews: data.reviews || []
            };
          });
        }
      } catch (err) {
        console.warn('Failed to fetch published shops from Firestore, using local data:', err);
      }
    }

    // If Firestore yielded no shops or failed, use local shops
    if (shopsList.length === 0) {
      shopsList = getLocalShops();
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
      // Sort by distance
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
          return {
            id: data.shopId || snapshot.id,
            ownerId: data.ownerId,
            name: data.shopName || data.name,
            category: data.category,
            imageUrl: data.shopImage || data.imageUrl,
            distance: '0.4 km',
            distanceMeters: 400,
            rating: data.rating || 4.5,
            isOpen: data.isOpen ?? true,
            isPublished: data.isPublished ?? true,
            openingTime: data.openingTime,
            closingTime: data.closingTime,
            foodQualityRating: data.foodQualityRating || 4.6,
            hygieneRating: data.hygieneRating || 4.5,
            serviceRating: data.serviceRating || 4.4,
            address: data.address,
            lat: data.latitude || data.lat,
            lng: data.longitude || data.lng,
            description: data.description,
            menuCardImage: data.menuImage || data.menuCardImage,
            menuItems: data.menuItems || [],
            reviews: data.reviews || []
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

    const shopDoc: ShopDocument = {
      shopId,
      ownerId: params.ownerId,
      shopName: params.shopName.trim(),
      category: params.category.trim(),
      description: params.description.trim(),
      latitude: params.latitude,
      longitude: params.longitude,
      openingTime: params.openingTime || '08:00 AM',
      closingTime: params.closingTime || '10:00 PM',
      shopImage: params.shopImage,
      menuImage: params.menuImage,
      isPublished: true,
      isOpen: true,
      rating: 4.8,
      foodQualityRating: 4.8,
      hygieneRating: 4.7,
      serviceRating: 4.6,
      address: params.address || 'Street Location',
      menuItems: params.menuItems || [
        { id: 'm-init-1', name: 'Signature Dish', price: '₹50', isVeg: true, category: 'Specials' }
      ],
      createdAt: now,
      updatedAt: now
    };

    const newShop: FoodShop = {
      id: shopId,
      ownerId: params.ownerId,
      name: shopDoc.shopName,
      category: shopDoc.category,
      imageUrl: shopDoc.shopImage,
      distance: '0.3 km',
      distanceMeters: 300,
      rating: shopDoc.rating,
      isOpen: true,
      isPublished: true,
      isPopular: true,
      openingTime: shopDoc.openingTime,
      closingTime: shopDoc.closingTime,
      foodQualityRating: shopDoc.foodQualityRating,
      hygieneRating: shopDoc.hygieneRating,
      serviceRating: shopDoc.serviceRating,
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
      latitude: shop.lat || 18.5204,
      longitude: shop.lng || 73.8567,
      openingTime: shop.openingTime || '08:00 AM',
      closingTime: shop.closingTime || '10:00 PM',
      shopImage: shop.imageUrl,
      menuImage: shop.menuCardImage,
      address: shop.address,
      menuItems: shop.menuItems
    });
  }
};

