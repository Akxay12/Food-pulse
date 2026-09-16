import React, { useState } from 'react';
import { Search, MapPin, Star, Navigation, ArrowRight, Store, X, SlidersHorizontal, Info } from 'lucide-react';
import { FoodShop } from '../../types';

interface MapScreenProps {
  shops: FoodShop[];
  onSelectShop: (shop: FoodShop) => void;
  onOpenShopkeeperSetup?: () => void;
  t: Record<string, string>;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  shops,
  onSelectShop,
  onOpenShopkeeperSetup,
  t
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRadius, setSelectedRadius] = useState<'500m' | '1km' | '2km' | '5km'>('2km');
  const [selectedShop, setSelectedShop] = useState<FoodShop | null>(shops[0] || null);

  const radiusMetersMap: Record<string, number> = {
    '500m': 500,
    '1km': 1000,
    '2km': 2000,
    '5km': 5000,
  };

  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.category.toLowerCase().includes(searchQuery.toLowerCase());
    const withinRadius = shop.distanceMeters <= radiusMetersMap[selectedRadius];
    return matchesSearch && withinRadius;
  });

  return (
    <div className="flex-1 flex flex-col relative bg-slate-100 overflow-hidden select-none">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 space-y-2.5 pointer-events-auto">
        {/* Title & Shared Map Badge */}
        <div className="flex items-center justify-between">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-md border border-slate-200/80 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800 tracking-tight">
              {t.nearbyFood || 'Nearby Food'} · Live Shared Map
            </span>
          </div>

          <button
            onClick={onOpenShopkeeperSetup}
            className="text-[11px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 transition-all active:scale-95"
          >
            <Store size={13} />
            <span>+ Add Stall</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchNearby || 'Search food or shop'}
            className="w-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md rounded-2xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Radius Selector Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(['500m', '1km', '2km', '5km'] as const).map((rad) => (
            <button
              key={rad}
              onClick={() => setSelectedRadius(rad)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-xs transition-all ${
                selectedRadius === rad
                  ? 'bg-orange-500 text-white shadow-orange-500/20'
                  : 'bg-white/95 backdrop-blur-xs text-slate-700 hover:bg-white border border-slate-200/80'
              }`}
            >
              {rad === '500m' ? '500 m' : rad.replace('km', ' km')}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Simulated Map Graphics */}
      <div className="w-full h-full relative bg-[#E5E9E7] flex items-center justify-center overflow-hidden">
        {/* SVG Roads, Waterway, and Parks Network */}
        <svg className="w-full h-full absolute inset-0 opacity-80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D3DBD5" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#E8EDE9" />
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Park area */}
          <path
            d="M 20 80 Q 80 40 140 90 T 260 80 L 280 200 L 40 220 Z"
            fill="#D4EAD6"
            stroke="#BDDEC0"
            strokeWidth="1.5"
          />
          <path
            d="M 220 380 Q 300 340 380 420 L 400 520 L 200 500 Z"
            fill="#D4EAD6"
            stroke="#BDDEC0"
            strokeWidth="1.5"
          />

          {/* Waterway / River */}
          <path
            d="M -20 300 C 80 320, 160 260, 260 330 S 380 390, 480 340"
            fill="none"
            stroke="#BDE0FE"
            strokeWidth="24"
            strokeLinecap="round"
          />

          {/* Major Avenues / Roads */}
          <path d="M -10 160 L 450 160" stroke="#FFFFFF" strokeWidth="12" />
          <path d="M -10 160 L 450 160" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6,6" />

          <path d="M -10 460 L 450 460" stroke="#FFFFFF" strokeWidth="10" />

          <path d="M 180 -10 L 180 700" stroke="#FFFFFF" strokeWidth="14" />
          <path d="M 180 -10 L 180 700" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6,6" />

          <path d="M 80 -10 L 80 700" stroke="#FFFFFF" strokeWidth="8" />
          <path d="M 320 -10 L 320 700" stroke="#FFFFFF" strokeWidth="8" />

          <path d="M 30 200 L 400 520" stroke="#FFFFFF" strokeWidth="9" />

          {/* User Radius Pulse Circle */}
          <circle cx="210" cy="380" r="140" fill="#F59E0B" fillOpacity="0.08" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4,4" />
        </svg>

        {/* User Current Location Indicator */}
        <div className="absolute top-[370px] left-[200px] z-10 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 animate-ping absolute"></div>
          <div className="w-5 h-5 rounded-full bg-orange-500 border-2 border-white shadow-md flex items-center justify-center text-white">
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>

        {/* Food Shop Pins positioned on map */}
        {filteredShops.map((shop, index) => {
          // Pre-mapped visual offsets
          const positions = [
            { top: '260px', left: '150px' }, // Shree Snacks
            { top: '340px', left: '290px' }, // Food Corner
            { top: '480px', left: '160px' }, // Taste Hub
            { top: '210px', left: '320px' }, // Spice Villa
          ];
          const pos = positions[index % positions.length];
          const isSelected = selectedShop?.id === shop.id;

          const pinBg = !shop.isOpen
            ? 'bg-slate-500 border-slate-300'
            : shop.isPopular || shop.rating >= 4.5
            ? 'bg-amber-500 border-amber-200'
            : 'bg-orange-500 border-amber-200';

          return (
            <button
              key={shop.id}
              onClick={() => setSelectedShop(shop)}
              style={{ top: pos.top, left: pos.left }}
              className={`absolute z-20 transform -translate-x-1/2 -translate-y-1/2 transition-all active:scale-95 group ${
                isSelected ? 'scale-115 z-30' : 'hover:scale-105'
              }`}
            >
              {/* Pin Callout Badge */}
              <div
                className={`px-2 py-1 rounded-xl text-[10px] font-extrabold text-white flex items-center gap-1 shadow-lg border-2 ${pinBg} ${
                  isSelected ? 'ring-3 ring-black/20' : ''
                }`}
              >
                <Store size={11} />
                <span className="truncate max-w-[85px]">{shop.name.split(' ')[0]}</span>
                <span className="text-[9px] opacity-90">★{shop.rating}</span>
              </div>
              {/* Pin tail point */}
              <div
                className={`w-2 h-2 rotate-45 mx-auto -mt-1 ${pinBg.split(' ')[0]}`}
              ></div>
            </button>
          );
        })}

        {/* Legend Overlay at Center Right */}
        <div className="absolute right-3 top-48 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-md border border-slate-200 text-[10px] space-y-1.5 z-20">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>Open</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Popular / Top Rated</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
            <span>Closed</span>
          </div>
        </div>
      </div>

      {/* Bottom Sheet Showing Selected Shop */}
      {selectedShop && (
        <div className="absolute bottom-2 left-3 right-3 z-30 bg-white rounded-3xl border border-slate-200/80 p-3.5 shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3">
            <img
              src={selectedShop.imageUrl}
              alt={selectedShop.name}
              className="w-18 h-18 rounded-2xl object-cover bg-slate-100 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    selectedShop.isOpen
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {selectedShop.isOpen ? '🟢 Open' : 'Closed'}
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  <span>{selectedShop.rating}</span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 truncate mt-1">
                {selectedShop.name}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">
                {selectedShop.category}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1">
                <span className="flex items-center gap-0.5 font-semibold text-orange-700">
                  <MapPin size={12} />
                  {selectedShop.distance}
                </span>
                <span>·</span>
                <span className="text-slate-500">Hygiene {selectedShop.hygieneRating}★</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Navigation size={12} className="text-orange-600" />
              <span>{selectedShop.openingTime} - {selectedShop.closingTime}</span>
            </div>

            <button
              onClick={() => onSelectShop(selectedShop)}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all"
            >
              <span>{t.viewShop || 'View Shop'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
