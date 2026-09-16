import React, { useState } from 'react';
import { ArrowLeft, MapPin, Upload, CheckCircle2, Clock, Store, Camera, FileText, Loader2, AlertCircle } from 'lucide-react';
import { FoodShop, MenuItem } from '../../types';
import { shopService } from '../../services/shopService';

interface SetupShopScreenProps {
  currentUserId?: string;
  onBack: () => void;
  onPublishShop: (newShop: FoodShop) => void;
}

export const SetupShopScreen: React.FC<SetupShopScreenProps> = ({
  currentUserId = 'local-shopkeeper-1',
  onBack,
  onPublishShop
}) => {
  const [shopName, setShopName] = useState('Anand Vada Pav & Dosa Corner');
  const [foodCategory, setFoodCategory] = useState('Mumbai Street Food & Snacks');
  const [openingTime, setOpeningTime] = useState('08:00 AM');
  const [closingTime, setClosingTime] = useState('10:00 PM');
  const [description, setDescription] = useState(
    'Specializing in piping hot Vada Pav, Misal, and mineral-water based chutneys. Clean, hygienic preparation guaranteed.'
  );

  // Map Location Picker State
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [pickedLocation, setPickedLocation] = useState({
    address: 'Near Mithibai College, Vile Parle West, Mumbai',
    lat: 19.019,
    lng: 72.849,
  });

  const [shopImage, setShopImage] = useState(
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80'
  );
  const [menuCardImage, setMenuCardImage] = useState(
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

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
      const createdShop = await shopService.createShop({
        ownerId: currentUserId,
        shopName: shopName.trim(),
        category: foodCategory.trim(),
        description: description.trim(),
        latitude: pickedLocation.lat,
        longitude: pickedLocation.lng,
        openingTime,
        closingTime,
        shopImage,
        menuImage: menuCardImage,
        address: pickedLocation.address,
        menuItems: [
          { id: 'm-new-1', name: 'Signature Butter Vada Pav', price: '₹25', isVeg: true, category: 'Fast Food' },
          { id: 'm-new-2', name: 'Cheese Chutney Grill Sandwich', price: '₹70', isVeg: true, category: 'Snacks' },
          { id: 'm-new-3', name: 'Special Cutting Chai', price: '₹15', isVeg: true, category: 'Beverages' },
        ]
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

        {/* Location Section: "[ Select Location on Map ]" */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Stall Location on Map
            </label>
            <span className="text-[10px] text-orange-600 font-bold">GPS Coordinates</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2 text-xs text-slate-700">
            <MapPin size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <span className="font-semibold">{pickedLocation.address}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsMapPickerOpen(!isMapPickerOpen)}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-orange-800 text-xs font-bold border border-amber-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <MapPin size={14} />
            <span>[ Select Location on Map ]</span>
          </button>

          {isMapPickerOpen && (
            <div className="rounded-xl overflow-hidden border border-slate-300 relative h-36 bg-amber-950/10 p-2 animate-fade-in flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center mx-auto mb-1 animate-bounce shadow-md">
                  <MapPin size={16} />
                </div>
                <span className="text-[11px] font-bold text-slate-800 block">
                  Stall Pin Placed at: Mithibai College Road
                </span>
                <span className="text-[10px] text-slate-500">
                  Lat: {pickedLocation.lat}, Lng: {pickedLocation.lng}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Image & Menu Card Upload */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Upload Shop Front Image
            </label>
            <div className="flex items-center gap-3">
              <img src={shopImage} alt="Shop Front" className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200" />
              <button
                type="button"
                onClick={() =>
                  setShopImage('https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80')
                }
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Camera size={14} />
                <span>Change Image</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Upload Menu Card
            </label>
            <div className="flex items-center gap-3">
              <img src={menuCardImage} alt="Menu Card" className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200" />
              <button
                type="button"
                onClick={() =>
                  setMenuCardImage('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80')
                }
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileText size={14} />
                <span>Upload Menu Photo</span>
              </button>
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
