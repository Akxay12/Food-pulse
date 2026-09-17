import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Star,
  Navigation,
  ArrowRight,
  Store,
  X,
  Locate,
  Info,
  AlertCircle,
  Plus,
  CheckCircle2,
  Camera,
  FileText,
  Loader2,
  Clock
} from 'lucide-react';
import { FoodShop } from '../../types';
import { mapService, UserCoordinates, LocationStatus } from '../../services/mapService';
import { shopService } from '../../services/shopService';

interface MapScreenProps {
  shops: FoodShop[];
  onSelectShop: (shop: FoodShop) => void;
  onOpenShopkeeperSetup?: (initialLocation?: { lat: number; lng: number }) => void;
  currentUserId?: string;
  userRole?: string;
  focusedShop?: FoodShop | null;
  t: Record<string, string>;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  shops: propShops,
  onSelectShop,
  onOpenShopkeeperSetup,
  currentUserId = 'local-user-1',
  userRole = 'user',
  focusedShop = null,
  t
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRadius, setSelectedRadius] = useState<'500m' | '1km' | '2km' | '5km'>('1km');
  const [selectedShop, setSelectedShop] = useState<FoodShop | null>(null);
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [liveShops, setLiveShops] = useState<FoodShop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(true);
  const [isGoogleMapActive, setIsGoogleMapActive] = useState<boolean>(false);
  const [mapsLoadNotice, setMapsLoadNotice] = useState<string | null>(null);

  // Pin Picking Mode State for Stall Registration
  const [isPickingLocation, setIsPickingLocation] = useState<boolean>(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  // In-map Stall Registration Form Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [newStallName, setNewStallName] = useState('');
  const [newStallCategory, setNewStallCategory] = useState('');
  const [newStallOpening, setNewStallOpening] = useState('08:00 AM');
  const [newStallClosing, setNewStallClosing] = useState('10:00 PM');
  const [newStallDescription, setNewStallDescription] = useState('');
  const [shopImageFile, setShopImageFile] = useState<File | null>(null);
  const [shopImagePreview, setShopImagePreview] = useState<string>('');
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuImagePreview, setMenuImagePreview] = useState<string>('');
  const [isPublishingStall, setIsPublishingStall] = useState<boolean>(false);
  const [publishSuccessNotice, setPublishSuccessNotice] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const googleMapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const hasInitialCenteredRef = useRef<boolean>(false);

  const radiusMetersMap: Record<string, number> = {
    '500m': 500,
    '1km': 1000,
    '2km': 2000,
    '5km': 5000,
  };

  // Helper to load live published shops from Firestore
  const loadPublishedShops = async (coords: UserCoordinates | null) => {
    setIsLoadingShops(true);
    try {
      const fetched = await shopService.getPublishedShops(coords);
      setLiveShops(fetched);
    } catch (err) {
      console.warn('[FoodCheck Maps] Error fetching published shops:', err);
    } finally {
      setIsLoadingShops(false);
    }
  };

  // 1. Safe development logging & Independent Google Maps + GPS Initialization
  useEffect(() => {
    console.log('[Map] Google Maps initialization started');
    const isApiKeyConfigured = mapService.isConfigured();
    console.log(`[Map] API key configured: ${isApiKeyConfigured}`);

    // Request GPS concurrently without blocking map initialization
    mapService.getCurrentLocation().then(({ coords, status }) => {
      setLocationStatus(status);

      if (coords) {
        setUserLocation(coords);
        setLocationMessage(null);
        setPickedLocation({ lat: Number(coords.lat.toFixed(6)), lng: Number(coords.lng.toFixed(6)) });
        loadPublishedShops(coords);

        // Center map around real GPS if map instance is already created
        if (mapInstanceRef.current) {
          console.log('[Map] Centering map on device location');
          mapInstanceRef.current.setCenter({ lat: coords.lat, lng: coords.lng });
          mapInstanceRef.current.setZoom(16);
          hasInitialCenteredRef.current = true;
        }
      } else {
        setLocationMessage('Unable to get your current location. Please enable location access.');
        loadPublishedShops(null);
      }
    });

    // Load Google Maps SDK independently
    mapService.loadGoogleMapsScript().then((loaded) => {
      const isLoaded = Boolean(loaded && (window as any).google?.maps);
      console.log(`[Map] Google Maps loaded: ${isLoaded}`);
      if (isLoaded) {
        setIsGoogleMapActive(true);
        setMapsLoadNotice(null);
      } else {
        setIsGoogleMapActive(false);
        setMapsLoadNotice('Google Maps API key not configured or offline. Showing interactive radar view.');
      }
    });
  }, []);

  // 2. Query Firestore when userLocation updates
  useEffect(() => {
    if (userLocation) {
      loadPublishedShops(userLocation);
    }
  }, [userLocation]);

  // 3. Filter shops strictly by Search Query and Selected Radius
  const filteredShops = liveShops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.category.toLowerCase().includes(searchQuery.toLowerCase());

    // If userLocation is not available yet, cannot verify radius
    if (!userLocation) return matchesSearch;

    const withinRadius = shop.distanceMeters <= radiusMetersMap[selectedRadius];
    return matchesSearch && withinRadius;
  });

  // Keep selectedShop in sync
  useEffect(() => {
    if (selectedShop && !filteredShops.some((s) => s.id === selectedShop.id)) {
      setSelectedShop(null);
    }
  }, [filteredShops, selectedShop]);

  // 4. Google Maps instance initialization & marker rendering
  useEffect(() => {
    if (!isGoogleMapActive || !googleMapRef.current || !(window as any).google?.maps) {
      return;
    }

    try {
      const gMaps = (window as any).google.maps;

      // Initialize map instance independently without waiting for GPS
      if (!mapInstanceRef.current) {
        const initialCenter = userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : { lat: 20.0, lng: 0.0 };

        mapInstanceRef.current = new gMaps.Map(googleMapRef.current, {
          center: initialCenter,
          zoom: userLocation ? 16 : 2,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] }, // Hide arbitrary commercial places; ONLY FoodCheck shops appear
            { featureType: 'transit', stylers: [{ visibility: 'simplified' }] }
          ]
        });

        console.log(`[Map] Map instance created: ${Boolean(mapInstanceRef.current)}`);

        if (userLocation) {
          hasInitialCenteredRef.current = true;
        }

        // Ensure proper layout rendering after mounting
        setTimeout(() => {
          if (mapInstanceRef.current && (window as any).google?.maps?.event) {
            (window as any).google.maps.event.trigger(mapInstanceRef.current, 'resize');
            if (userLocation) {
              mapInstanceRef.current.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
            }
          }
        }, 150);

        // Listener for map movement: update picked location in pin-picker mode
        mapInstanceRef.current.addListener('center_changed', () => {
          const center = mapInstanceRef.current.getCenter();
          if (center) {
            setPickedLocation({
              lat: Number(center.lat().toFixed(6)),
              lng: Number(center.lng().toFixed(6))
            });
          }
        });
      }

      // If user location is acquired and we haven't centered yet, center with local neighborhood zoom (16)
      if (userLocation && !hasInitialCenteredRef.current && mapInstanceRef.current) {
        console.log('[Map] Centering map on device location');
        mapInstanceRef.current.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
        mapInstanceRef.current.setZoom(16);
        hasInitialCenteredRef.current = true;
      }

      // Update or create "You are here" marker
      if (userLocation && mapInstanceRef.current) {
        if (userMarkerRef.current) {
          userMarkerRef.current.setPosition({ lat: userLocation.lat, lng: userLocation.lng });
        } else {
          userMarkerRef.current = new gMaps.Marker({
            position: { lat: userLocation.lat, lng: userLocation.lng },
            map: mapInstanceRef.current,
            title: 'You are here',
            zIndex: 1000,
            icon: {
              path: gMaps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#2563EB',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3
            }
          });
        }

        // Update or create Radius boundary circle on map
        if (radiusCircleRef.current) {
          radiusCircleRef.current.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
          radiusCircleRef.current.setRadius(radiusMetersMap[selectedRadius]);
        } else {
          radiusCircleRef.current = new gMaps.Circle({
            map: mapInstanceRef.current,
            center: { lat: userLocation.lat, lng: userLocation.lng },
            radius: radiusMetersMap[selectedRadius],
            fillColor: '#F97316',
            fillOpacity: 0.06,
            strokeColor: '#EA580C',
            strokeOpacity: 0.35,
            strokeWeight: 1.5
          });
        }
      }

      // Clear existing shop markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      // Add markers ONLY for verified FoodCheck shops within radius
      filteredShops.forEach((shop) => {
        const marker = new gMaps.Marker({
          position: { lat: shop.lat, lng: shop.lng },
          map: mapInstanceRef.current,
          title: shop.name,
          zIndex: 500,
          icon: {
            path: gMaps.SymbolPath.CIRCLE,
            fillColor: '#F97316',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2.5,
            scale: 9
          }
        });

        marker.addListener('click', () => {
          setSelectedShop(shop);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo({ lat: shop.lat, lng: shop.lng });
          }
        });

        markersRef.current.push(marker);
      });
    } catch (mapErr) {
      console.error('[FoodCheck Maps] Error rendering Google Maps markers:', mapErr);
    }
  }, [isGoogleMapActive, userLocation, filteredShops, selectedRadius]);

  // Auto-center map on newly created or focused shop
  useEffect(() => {
    if (focusedShop) {
      setSelectedShop(focusedShop);
      if (mapInstanceRef.current && typeof focusedShop.lat === 'number' && typeof focusedShop.lng === 'number') {
        mapInstanceRef.current.setCenter({ lat: focusedShop.lat, lng: focusedShop.lng });
        mapInstanceRef.current.setZoom(17);
      }
    }
  }, [focusedShop]);

  const handleRequestLocation = async () => {
    setLocationMessage(null);
    const { coords, status } = await mapService.getCurrentLocation();
    setLocationStatus(status);
    if (coords) {
      setUserLocation(coords);
      if (mapInstanceRef.current) {
        console.log('[Map] Centering map on device location');
        mapInstanceRef.current.setZoom(16);
        mapInstanceRef.current.panTo({ lat: coords.lat, lng: coords.lng });
      }
      loadPublishedShops(coords);
    } else {
      setLocationMessage('Unable to get your current location. Please enable location access.');
    }
  };

  // Start Stall Registration Pin-Picker Mode
  const handleStartStallRegistration = () => {
    setSelectedShop(null);
    setIsPickingLocation(true);

    // Initial pin coordinates: use current map center or user location
    if (mapInstanceRef.current) {
      const center = mapInstanceRef.current.getCenter();
      if (center) {
        setPickedLocation({
          lat: Number(center.lat().toFixed(6)),
          lng: Number(center.lng().toFixed(6))
        });
      }
    } else if (userLocation) {
      setPickedLocation({ lat: userLocation.lat, lng: userLocation.lng });
    }
  };

  // Confirm Location & Open Details Form
  const handleConfirmLocation = () => {
    setIsPickingLocation(false);
    setIsRegisterModalOpen(true);
  };

  // Image Selection Handlers for Real Files
  const handleShopImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setShopImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setShopImagePreview((event.target?.result as string) || '');
      reader.readAsDataURL(file);
    }
  };

  const handleMenuImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMenuImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setMenuImagePreview((event.target?.result as string) || '');
      reader.readAsDataURL(file);
    }
  };

  // Publish Shop to Firebase Firestore & Storage
  const handlePublishStall = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!newStallName.trim()) {
      setRegisterError('Please enter the stall or shop name.');
      return;
    }
    if (!newStallCategory.trim()) {
      setRegisterError('Please enter a food category.');
      return;
    }

    setIsPublishingStall(true);
    try {
      let uploadedShopUrl = '';
      let uploadedMenuUrl = '';

      // Upload actual stall photo to Firebase Storage
      if (shopImageFile) {
        uploadedShopUrl = await shopService.uploadShopMedia(shopImageFile, currentUserId, 'stall');
      }

      // Upload actual menu photo to Firebase Storage
      if (menuImageFile) {
        uploadedMenuUrl = await shopService.uploadShopMedia(menuImageFile, currentUserId, 'menu');
      }

      // Create new shop with confirmed pin location
      const newShop = await shopService.createShop({
        ownerId: currentUserId,
        shopName: newStallName.trim(),
        category: newStallCategory.trim(),
        description: newStallDescription.trim(),
        latitude: pickedLocation.lat,
        longitude: pickedLocation.lng,
        openingTime: newStallOpening,
        closingTime: newStallClosing,
        shopImage: uploadedShopUrl,
        menuImage: uploadedMenuUrl,
        address: `Lat: ${pickedLocation.lat}, Lng: ${pickedLocation.lng}`,
        menuItems: []
      });

      // Reload live shops from Firestore
      await loadPublishedShops(userLocation);

      // Pan map to newly published stall
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: pickedLocation.lat, lng: pickedLocation.lng });
        mapInstanceRef.current.setZoom(16);
      }

      // Close modal and select the newly registered shop
      setIsRegisterModalOpen(false);
      setSelectedShop(newShop);
      setPublishSuccessNotice(`"${newShop.name}" successfully registered and published on FoodCheck!`);

      // Reset form fields
      setNewStallName('');
      setNewStallCategory('');
      setNewStallDescription('');
      setShopImageFile(null);
      setShopImagePreview('');
      setMenuImageFile(null);
      setMenuImagePreview('');

      setTimeout(() => setPublishSuccessNotice(null), 5000);
    } catch (err: any) {
      setRegisterError(err.message || 'Failed to publish stall. Please try again.');
    } finally {
      setIsPublishingStall(false);
    }
  };

  return (
    <div
      className="w-full h-full flex-1 flex flex-col relative bg-slate-100 overflow-hidden select-none min-h-0"
      style={{ height: '100%', minHeight: '100%', position: 'relative' }}
    >
      {/* Top Floating Controls Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 space-y-2.5 pointer-events-auto">
        {/* Title & Shared Map Badge */}
        <div className="flex items-center justify-between">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-md border border-slate-200/80 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800 tracking-tight">
              {t.nearbyFood || 'Nearby Food'} · FoodCheck Shared Map
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRequestLocation}
              className={`w-8 h-8 rounded-full bg-white shadow-md border flex items-center justify-center active:scale-90 transition-transform cursor-pointer ${
                locationStatus === 'granted' ? 'text-blue-600 border-blue-200' : 'text-slate-600 border-slate-200'
              }`}
              title="Locate my position"
            >
              <Locate size={15} />
            </button>
          </div>
        </div>

        {/* Location Status Notice (when permission denied or unavailable) */}
        {locationMessage && (
          <div className="bg-amber-50/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-xs border border-amber-300 text-[11px] text-amber-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
              <span className="truncate font-medium">{locationMessage}</span>
            </div>
            <button
              onClick={handleRequestLocation}
              className="px-2 py-0.5 rounded-lg bg-orange-500 text-white font-bold text-[10px] whitespace-nowrap active:scale-95"
            >
              Retry Location
            </button>
          </div>
        )}

        {/* Notice chip when Google Maps is unconfigured */}
        {mapsLoadNotice && (
          <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl shadow-xs border border-amber-300 text-[10px] text-amber-900 flex items-center gap-1.5">
            <Info size={13} className="text-amber-600 flex-shrink-0" />
            <span className="truncate">{mapsLoadNotice}</span>
          </div>
        )}

        {/* Search Bar */}
        {!isPickingLocation && (
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchNearby || 'Search registered FoodCheck stalls...'}
              className="w-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md rounded-2xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
        )}

        {/* Radius Selector Chips (default 1km) */}
        {!isPickingLocation && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(['500m', '1km', '2km', '5km'] as const).map((rad) => (
              <button
                key={rad}
                onClick={() => setSelectedRadius(rad)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-xs transition-all cursor-pointer ${
                  selectedRadius === rad
                    ? 'bg-orange-500 text-white shadow-orange-500/20'
                    : 'bg-white/95 backdrop-blur-xs text-slate-700 hover:bg-white border border-slate-200/80'
                }`}
              >
                {rad === '500m' ? '500 m' : rad.replace('km', ' km')}
              </button>
            ))}
          </div>
        )}

        {/* Picking Location Header Banner */}
        {isPickingLocation && (
          <div className="bg-orange-600 text-white px-3.5 py-2.5 rounded-2xl shadow-lg border border-orange-500 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black">Move Map to Stall Location</h3>
              <p className="text-[10px] text-orange-100">
                Pin remains fixed in the center — drag map underneath
              </p>
            </div>
            <button
              onClick={() => setIsPickingLocation(false)}
              className="bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Main Map Container */}
      <div
        className="w-full h-full flex-1 min-h-0 relative bg-[#E5E9E7] flex items-center justify-center overflow-hidden"
        style={{ width: '100%', height: '100%', minHeight: '100%', position: 'relative' }}
      >
        {/* Real Google Maps Canvas (active when SDK loads) */}
        <div
          ref={googleMapRef}
          className={`w-full h-full absolute inset-0 ${isGoogleMapActive ? 'block' : 'hidden'}`}
          style={{ width: '100%', height: '100%', minHeight: '100%' }}
          onClick={() => {
            if (!isPickingLocation) {
              setSelectedShop(null);
            }
          }}
        />

        {/* Vector Radar Canvas Fallback (active when Google Maps key is not available) */}
        {!isGoogleMapActive && (
          <div
            className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
            onClick={() => {
              if (!isPickingLocation) {
                setSelectedShop(null);
              }
            }}
          >
            <svg className="w-full h-full absolute inset-0 opacity-85" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D3DBD5" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="#E8EDE9" />
              <rect width="100%" height="100%" fill="url(#mapGrid)" />

              {/* Roads */}
              <path d="M -10 160 L 450 160" stroke="#FFFFFF" strokeWidth="12" />
              <path d="M -10 460 L 450 460" stroke="#FFFFFF" strokeWidth="10" />
              <path d="M 180 -10 L 180 700" stroke="#FFFFFF" strokeWidth="14" />
              <path d="M 80 -10 L 80 700" stroke="#FFFFFF" strokeWidth="8" />
              <path d="M 320 -10 L 320 700" stroke="#FFFFFF" strokeWidth="8" />

              {/* User Radius Circle */}
              {userLocation && (
                <circle
                  cx="210"
                  cy="380"
                  r={selectedRadius === '500m' ? 70 : selectedRadius === '1km' ? 110 : selectedRadius === '2km' ? 160 : 210}
                  fill="#F59E0B"
                  fillOpacity="0.06"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
              )}
            </svg>

            {/* "You Are Here" Current Location Indicator */}
            {userLocation && (
              <div className="absolute top-[370px] left-[200px] z-10 flex flex-col items-center pointer-events-none">
                <div className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs mb-1 whitespace-nowrap">
                  You are here
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 animate-ping absolute"></div>
                  <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Radar Stall Markers */}
            {filteredShops.map((shop, idx) => {
              const offsetX = 140 + (idx % 3) * 65;
              const offsetY = 280 + (idx % 2) * 90;
              return (
                <button
                  key={shop.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedShop(shop);
                  }}
                  style={{ top: `${offsetY}px`, left: `${offsetX}px` }}
                  className="absolute z-20 flex flex-col items-center active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-orange-500 border-2 border-white shadow-lg flex items-center justify-center text-white">
                    <Store size={14} />
                  </div>
                  <span className="text-[10px] font-bold bg-white/95 px-1.5 py-0.5 rounded shadow-xs text-slate-800 mt-1 truncate max-w-[80px]">
                    {shop.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Fixed Center Pin during Stall-Registration Location Picking Mode */}
        {isPickingLocation && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-30 flex flex-col items-center animate-bounce-subtle">
            <div className="bg-orange-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg mb-1 whitespace-nowrap border border-white flex items-center gap-1">
              <Store size={12} />
              <span>Stall Location</span>
            </div>
            <div className="text-orange-600 filter drop-shadow-md">
              <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 46 18 46C18 46 36 31.5 36 18C36 8.06 27.94 0 18 0Z"
                  fill="#EA580C"
                />
                <circle cx="18" cy="18" r="8" fill="white" />
                <circle cx="18" cy="18" r="4" fill="#EA580C" />
              </svg>
            </div>
            <div className="w-3 h-1.5 bg-black/35 rounded-full blur-[1px] -mt-1"></div>
          </div>
        )}

        {/* Non-Blocking Slim Empty State Pill when no FoodCheck stalls nearby */}
        {!isLoadingShops && filteredShops.length === 0 && !isPickingLocation && !selectedShop && (
          <div className="absolute top-36 left-4 right-4 z-20 pointer-events-none flex justify-center animate-fade-in">
            <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-200/90 flex items-center gap-2 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              <span className="text-xs font-bold text-slate-800">No FoodCheck stalls nearby.</span>
              <span className="text-[10px] text-slate-500 font-medium">(change radius to explore)</span>
            </div>
          </div>
        )}

        {/* Success Notice Banner after Stall Published */}
        {publishSuccessNotice && (
          <div className="absolute top-28 left-4 right-4 z-40 bg-emerald-600 text-white p-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
            <CheckCircle2 size={18} className="flex-shrink-0" />
            <span>{publishSuccessNotice}</span>
          </div>
        )}
      </div>

      {/* Floating Bottom "+ Register Stall" Action Button (Visible during normal browsing) */}
      {!isPickingLocation && !selectedShop && (
        <div className="absolute bottom-20 right-4 z-30 pointer-events-auto">
          <button
            onClick={handleStartStallRegistration}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs py-3 px-4.5 rounded-full shadow-xl shadow-orange-500/30 flex items-center gap-2 active:scale-95 transition-transform cursor-pointer border border-white/20"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Register Stall</span>
          </button>
        </div>
      )}

      {/* Location Picker Confirmation Floating Bar */}
      {isPickingLocation && (
        <div className="absolute bottom-20 left-4 right-4 z-30 bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-slate-200/90 space-y-3 pointer-events-auto animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Selected Stall Location
              </span>
              <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                Lat: <span className="text-orange-600">{pickedLocation.lat}</span> · Lng:{' '}
                <span className="text-orange-600">{pickedLocation.lng}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              📍 Drag map to adjust
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsPickingLocation(false)}
              className="flex-1 py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmLocation}
              className="flex-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Confirm This Location</span>
            </button>
          </div>
        </div>
      )}

      {/* Compact Bottom Sheet for Selected FoodCheck Stall (Positioned cleanly above BottomNav) */}
      {selectedShop && (
        <div className="absolute bottom-20 left-3 right-3 z-35 bg-white rounded-3xl border border-slate-200/90 p-4 shadow-2xl animate-fade-in pointer-events-auto">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                selectedShop.isOpen ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {selectedShop.isOpen ? '🟢 Open Now' : 'Closed'}
            </span>

            <button
              onClick={() => setSelectedShop(null)}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          {/* Tappable Card Body */}
          <div
            onClick={() => onSelectShop(selectedShop)}
            className="flex items-center gap-3 cursor-pointer group"
            title="Tap to view stall details"
          >
            {selectedShop.imageUrl ? (
              <img
                src={selectedShop.imageUrl}
                alt={selectedShop.name}
                className="w-18 h-18 rounded-2xl object-cover bg-slate-100 flex-shrink-0 ring-1 ring-slate-200 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-18 h-18 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-amber-700 flex-shrink-0">
                <Store size={22} />
                <span className="text-[9px] font-semibold mt-0.5 text-center px-1">
                  No photos uploaded yet.
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-orange-600 transition-colors">
                {selectedShop.name}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">{selectedShop.category}</p>

              <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1">
                {selectedShop.distance ? (
                  <span className="flex items-center gap-0.5 font-semibold text-orange-700">
                    <MapPin size={12} />
                    {selectedShop.distance}
                  </span>
                ) : null}

                <div className="flex items-center gap-1 font-bold text-slate-800">
                  {selectedShop.rating > 0 && selectedShop.reviewsCount ? (
                    <>
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span>{selectedShop.rating}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({selectedShop.reviewsCount})
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal">No ratings yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
              <Clock size={12} className="text-orange-600 flex-shrink-0" />
              <span>
                {selectedShop.openingTime && selectedShop.closingTime
                  ? `${selectedShop.openingTime} - ${selectedShop.closingTime}`
                  : 'Hours not specified'}
              </span>
            </div>

            {/* Prominent, Tappable View Shop / Shop Details Button */}
            <button
              onClick={() => onSelectShop(selectedShop)}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-orange-500/25 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap min-h-[38px]"
              aria-label={`View ${selectedShop.name} details`}
            >
              <span>{t.viewShop || 'View Shop'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* In-Map Stall Details & Media Upload Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-orange-600 flex items-center justify-center">
                  <Store size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Register Food Stall</h3>
                  <p className="text-[11px] text-slate-500">Live on FoodCheck Map</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form
              onSubmit={handlePublishStall}
              className="p-5 overflow-y-auto space-y-4"
              style={{ paddingBottom: 'max(1.5rem, calc(1rem + env(safe-area-inset-bottom, 0px)))' }}
            >
              {registerError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{registerError}</span>
                </div>
              )}

              {/* Confirmed Pin Coordinates Box */}
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-orange-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                      Confirmed Stall Coordinates
                    </span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                      Lat: {pickedLocation.lat} · Lng: {pickedLocation.lng}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    setIsPickingLocation(true);
                  }}
                  className="text-[11px] font-bold text-orange-700 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Stall Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stall / Shop Name *
                </label>
                <input
                  type="text"
                  value={newStallName}
                  onChange={(e) => setNewStallName(e.target.value)}
                  placeholder="e.g. Laxmi Chaat Bhandar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>

              {/* Food Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Food Category *
                </label>
                <input
                  type="text"
                  value={newStallCategory}
                  onChange={(e) => setNewStallCategory(e.target.value)}
                  placeholder="e.g. Street Food, Dosa, Pav Bhaji, Juices"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>

              {/* Operating Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Opening Time
                  </label>
                  <input
                    type="text"
                    value={newStallOpening}
                    onChange={(e) => setNewStallOpening(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Closing Time
                  </label>
                  <input
                    type="text"
                    value={newStallClosing}
                    onChange={(e) => setNewStallClosing(e.target.value)}
                    placeholder="10:00 PM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description & Specialties
                </label>
                <textarea
                  rows={2}
                  value={newStallDescription}
                  onChange={(e) => setNewStallDescription(e.target.value)}
                  placeholder="Tell nearby food lovers what makes your stall special..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* Photo & Menu Upload (Actual Files to Firebase Storage) */}
              <div className="space-y-3 pt-1">
                {/* Stall Photo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Stall Photo (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    {shopImagePreview ? (
                      <div className="relative">
                        <img
                          src={shopImagePreview}
                          alt="Stall preview"
                          className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShopImageFile(null);
                            setShopImagePreview('');
                          }}
                          className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        <Camera size={18} />
                      </div>
                    )}
                    <label className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <Camera size={14} />
                      <span>{shopImagePreview ? 'Change Photo' : 'Upload Stall Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleShopImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Menu Card Photo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Menu Photo (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    {menuImagePreview ? (
                      <div className="relative">
                        <img
                          src={menuImagePreview}
                          alt="Menu preview"
                          className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setMenuImageFile(null);
                            setMenuImagePreview('');
                          }}
                          className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        <FileText size={18} />
                      </div>
                    )}
                    <label className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <FileText size={14} />
                      <span>{menuImagePreview ? 'Change Menu' : 'Upload Menu Card'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMenuImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Publish Button */}
              <button
                type="submit"
                disabled={isPublishingStall}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isPublishingStall ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Publishing stall to FoodCheck map…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Publish Stall to FoodCheck Map</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

