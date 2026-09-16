import { MAPS_API_KEY, isMapsConfigured } from './firebase';

export interface UserCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export const mapService = {
  /**
   * Check if live Google Maps API key is configured
   */
  isConfigured(): boolean {
    return isMapsConfigured;
  },

  /**
   * Get Maps API Key if available
   */
  getApiKey(): string {
    return MAPS_API_KEY;
  },

  /**
   * Request device GPS coordinates with proper permission handling
   */
  async getCurrentLocation(): Promise<{ coords: UserCoordinates | null; status: 'granted' | 'denied' | 'unavailable' }> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return { coords: null, status: 'unavailable' };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            },
            status: 'granted'
          });
        },
        (error) => {
          console.info('[FoodCheck Map] Geolocation access not granted or timed out:', error.message);
          resolve({
            coords: { lat: 19.0178, lng: 72.8478 }, // Default Dadar / Mumbai center
            status: error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'
          });
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  }
};
