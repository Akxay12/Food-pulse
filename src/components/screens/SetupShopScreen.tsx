import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Upload, CheckCircle2, Clock, Store, Camera, FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { FoodShop, MenuItem } from '../../types';
import { shopService } from '../../services/shopService';
import { mapService } from '../../services/mapService';

interface SetupShopScreenProps {
  currentUserId?: string;
  initialLocation?: { lat: number; lng: number; address?: string };
  onBack: () => void;
  onPublishShop: (newShop: FoodShop) => void;
}

export const SetupShopScreen: React.FC<SetupShopScreenProps> = ({
  currentUserId = 'local-shopkeeper-1',
  initialLocation,
  onBack,
  onPublishShop
}) => {
  const [shopName, setShopName] = useState('');
  const [foodCategory, setFoodCategory] = useState('');
  const [openingTime, setOpeningTime] = useState('08:00 AM');
  const [closingTime, setClosingTime] = useState('10:00 PM');
  const [description, setDescription] = useState('');

  // Map Location Picker State
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [pickedLocation, setPickedLocation] = useState({
    address: initialLocation?.address || 'Fetching device GPS location...',
    lat: initialLocation?.lat || 0,
    lng: initialLocation?.lng || 0,
  });

  const [shopImage, setShopImage] = useState('');
  const [shopImageFile, setShopImageFile] = useState<File | null>(null);
  const [menuCardImage, setMenuCardImage] = useState('');
  const [menuCardImageFile, setMenuCardImageFile] = useState<File | null>(null);

  // Fetch real device GPS coordinates on mount if no initial location passed
  useEffect(() => {
    if (initialLocation && initialLocation.lat && initialLocation.lng) {
      setPickedLocation({
        address: initialLocation.address || 'Selected Map Location',
        lat: Number(initialLocation.lat.toFixed(6)),
        lng: Number(initialLocation.lng.toFixed(6))
      });
      return;
    }

    mapService.getCurrentLocation().then(({ coords, status }) => {
      if (coords) {
        setPickedLocation({
          address: 'Current Device GPS Location',
          lat: Number(coords.lat.toFixed(6)),
          lng: Number(coords.lng.toFixed(6))
        });
      } else {
        setPickedLocation((prev) => ({
          ...prev,
          address: 'Please set or enable GPS location'
        }));
      }
    });
  }, [initialLocation]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleImageFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (val: string) => void,
    setFile: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRefreshLocation = async () => {
    const { coords, status, message } = await mapService.getCurrentLocation();
    if (coords) {
      setPickedLocation({
        address: 'Current Device GPS Location',
        lat: Number(coords.lat.toFixed(6)),
        lng: Number(coords.lng.toFixed(6))
      });
      setErrorMessage(null);
    } else {
      setErrorMessage(message || 'Unable to fetch device GPS location.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!shopName.trim()) {
      setErrorMessage('Please enter your shop / stall name.');
      return;
    }
    if (!foodCategory.trim()) {
      setErrorMessage('Please enter food category.');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedShopImage = shopImage;
      let uploadedMenuImage = menuCardImage;

      // Upload real files to Firebase Storage if selected
      if (shopImageFile) {
        uploadedShopImage = await shopService.uploadShopMedia(shopImageFile, currentUserId, 'stall');
      }
      if (menuCardImageFile) {
        uploadedMenuImage = await shopService.uploadShopMedia(menuCardImageFile, currentUserId, 'menu');
      }

      const createdShop = await shopService.createShop({
        ownerId: currentUserId,
        shopName: shopName.trim(),
        category: foodCategory.trim(),
        description: description.trim(),
        latitude: pickedLocation.lat,
        longitude: pickedLocation.lng,
        openingTime,
        closingTime,
        shopImage: uploadedShopImage,
        menuImage: uploadedMenuImage,
        address: pickedLocation.address,
        menuItems: []
      });

      setShowCelebration(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onPublishShop(createdShop);
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to publish shop.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F2] text-slate-900 overflow-y-auto select-none">
      {/* Top Bar */}
      <div className="bg-white px-4 py-3.5 border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Setup Stall on FoodCheck
        </h2>
        <div className="w-9"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-12">
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-orange-950 font-medium leading-relaxed">
          🌟 Once published, your stall appears instantly on the shared FoodCheck map for all nearby students and foodies!
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Shop Name & Category */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Shop / Stall Name
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Shree Ganesh Chaat Center"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Food Category
            </label>
            <input
              type="text"
              value={foodCategory}
              onChange={(e) => setFoodCategory(e.target.value)}
              placeholder="e.g. Chaat, Fast Food, Dosa, Juices"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
              required
            />
          </div>
        </div>

        {/* Timings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2.5">
            Operating Hours
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Opening Time
              </label>
              <input
                type="text"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                placeholder="08:00 AM"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Closing Time
              </label>
              <input
                type="text"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                placeholder="10:00 PM"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Shop Description */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Shop Description & Hygiene Standards
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your specialties and cleanliness measures..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
          />
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin size={14} className="text-orange-500" />
              Stall GPS Location
            </label>
            <button
              type="button"
              onClick={handleRefreshLocation}
              className="text-[11px] text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Refresh GPS</span>
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="font-semibold text-slate-800">{pickedLocation.address}</div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
              <span>Lat: <strong className="text-slate-800">{pickedLocation.lat || '—'}</strong></span>
              <span>Lng: <strong className="text-slate-800">{pickedLocation.lng || '—'}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={pickedLocation.lat || ''}
                onChange={(e) => setPickedLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 19.0760"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={pickedLocation.lng || ''}
                onChange={(e) => setPickedLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 72.8777"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Real Image & Menu Card Upload */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Upload Shop Front Image (Optional)
            </label>
            <div className="flex items-center gap-3">
              {shopImage ? (
                <div className="relative">
                  <img src={shopImage} alt="Shop Front" className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200" />
                  <button
                    type="button"
                    onClick={() => setShopImage('')}
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
                <span>{shopImage ? 'Change Image' : 'Select Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange(e, setShopImage, setShopImageFile)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Upload Menu Card (Optional)
            </label>
            <div className="flex items-center gap-3">
              {menuCardImage ? (
                <div className="relative">
                  <img src={menuCardImage} alt="Menu Card" className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuCardImage('');
                      setMenuCardImageFile(null);
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
                <span>{menuCardImage ? 'Change Menu' : 'Select Menu Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange(e, setMenuCardImage, setMenuCardImageFile)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Publish Shop CTA */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Publishing stall…</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              <span>Publish Shop to FoodCheck Map</span>
            </>
          )}
        </button>
      </form>

      {/* Celebratory Publishing Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-center animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xs shadow-2xl text-slate-900 space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-orange-600 flex items-center justify-center mx-auto text-3xl">
              🎉
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Stall Published Successfully!
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your stall <strong>“{shopName}”</strong> is now live on the shared FoodCheck map!
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-bold text-orange-700 bg-amber-50 px-3 py-1 rounded-full">
                Redirecting to Live Map...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
