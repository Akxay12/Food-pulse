import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface UserCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export type LocationStatus = 'idle' | 'granted' | 'denied' | 'unavailable' | 'timeout';

function getMapsApiKey(): string {
  const raw = import.meta.env.VITE_MAPS_API_KEY;
  if (!raw) return '';
  const cleaned = String(raw).trim().replace(/^["']|["']$/g, '').trim();
  if (cleaned === '' || cleaned === 'MY_MAPS_API_KEY' || cleaned === '""' || cleaned === "''") {
    return '';
  }
  return cleaned;
}

let mapsScriptPromise: Promise<boolean> | null = null;

export const mapService = {
  /**
   * Check if live Google Maps API key is configured
   */
  isConfigured(): boolean {
    return Boolean(getMapsApiKey());
  },

  /**
   * Get Maps API Key if available (internal use only, never logged)
   */
  getApiKey(): string {
    return getMapsApiKey();
  },

  /**
   * Dynamically loads Google Maps JavaScript SDK when VITE_MAPS_API_KEY is configured
   * Logs initialization & load state WITHOUT exposing key.
   */
  async loadGoogleMapsScript(): Promise<boolean> {
    const apiKey = getMapsApiKey();
    const configured = Boolean(apiKey);

    if (!configured) {
      console.info('[Map] Google Maps API key is not configured in VITE_MAPS_API_KEY.');
      return false;
    }

    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      return true;
    }

    if (mapsScriptPromise) {
      return mapsScriptPromise;
    }

    mapsScriptPromise = new Promise<boolean>((resolve) => {
      try {
        const existingScript = document.getElementById('google-maps-sdk');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve(true));
          existingScript.addEventListener('error', () => resolve(false));
          return;
        }

        const script = document.createElement('script');
        script.id = 'google-maps-sdk';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);

        document.head.appendChild(script);
      } catch (err) {
        console.error('[Map] Error during Google Maps script injection:', err);
        resolve(false);
      }
    });

    return mapsScriptPromise;
  },

  /**
   * Request real device GPS coordinates directly from mobile device via Capacitor Geolocation
   * NEVER returns hardcoded coordinates.
   */
  async getCurrentLocation(): Promise<{ coords: UserCoordinates | null; status: LocationStatus; message?: string }> {
    console.log('[Location] Requesting device location');

    // 1. Try native Capacitor Geolocation (Android / iOS / Capacitor bridge)
    try {
      let permStatus = await Geolocation.checkPermissions();
      let isGranted = permStatus.location === 'granted' || (permStatus as any).coarseLocation === 'granted';
      console.log(`[Location] Permission status: ${isGranted ? 'granted' : 'denied'}`);

      if (!isGranted) {
        permStatus = await Geolocation.requestPermissions();
        isGranted = permStatus.location === 'granted' || (permStatus as any).coarseLocation === 'granted';
        console.log(`[Location] Permission status: ${isGranted ? 'granted' : 'denied'}`);
      }

      if (isGranted) {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0 // Fresh GPS reading from device — never cached location
        });

        if (pos && pos.coords) {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const hasLat = typeof lat === 'number' && !isNaN(lat);
          const hasLng = typeof lng === 'number' && !isNaN(lng);

          console.log(`[Location] Location received: ${hasLat && hasLng}`);
          console.log(`[Location] Latitude received: ${hasLat}`);
          console.log(`[Location] Longitude received: ${hasLng}`);

          if (import.meta.env.DEV) {
            console.log(`[Location] Device coordinates: lat=${lat}, lng=${lng}`);
          }

          return {
            coords: {
              lat,
              lng,
              accuracy: pos.coords.accuracy
            },
            status: 'granted'
          };
        }
      } else {
        console.log('[Location] Location received: false');
        console.log('[Location] Latitude received: false');
        console.log('[Location] Longitude received: false');
        return {
          coords: null,
          status: 'denied',
          message: 'Unable to get your current location. Please enable location access.'
        };
      }
    } catch (capErr: any) {
      console.warn('[Location] Capacitor Geolocation error, attempting web fallback:', capErr?.message || capErr);
    }

    // 2. Standard browser navigator.geolocation fallback (for web development)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const hasLat = typeof lat === 'number' && !isNaN(lat);
            const hasLng = typeof lng === 'number' && !isNaN(lng);

            console.log('[Location] Permission status: granted');
            console.log(`[Location] Location received: ${hasLat && hasLng}`);
            console.log(`[Location] Latitude received: ${hasLat}`);
            console.log(`[Location] Longitude received: ${hasLng}`);

            if (import.meta.env.DEV) {
              console.log(`[Location] Device coordinates: lat=${lat}, lng=${lng}`);
            }

            resolve({
              coords: {
                lat,
                lng,
                accuracy: position.coords.accuracy
              },
              status: 'granted'
            });
          },
          (error) => {
            console.log(`[Location] Permission status: ${error.code === error.PERMISSION_DENIED ? 'denied' : 'denied'}`);
            console.log('[Location] Location received: false');
            console.log('[Location] Latitude received: false');
            console.log('[Location] Longitude received: false');

            let message = 'Unable to get your current location. Please enable location access.';
            resolve({
              coords: null,
              status: error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable',
              message
            });
          },
          { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
        );
      });
    }

    console.log('[Location] Location received: false');
    console.log('[Location] Latitude received: false');
    console.log('[Location] Longitude received: false');
    return {
      coords: null,
      status: 'unavailable',
      message: 'Unable to get your current location. Please enable location access.'
    };
  }
};

