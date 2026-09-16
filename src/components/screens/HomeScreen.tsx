import React from 'react';
import { Camera, MapPin, Star, Bell, ArrowRight, ShieldCheck, Flame, MessageSquareHeart, Sparkles } from 'lucide-react';
import { FoodScanResult, FoodShop, AppScreen } from '../../types';

interface HomeScreenProps {
  userName?: string;
  userAvatar?: string;
  unreadNotificationsCount?: number;
  recentScans: FoodScanResult[];
  nearbyShops: FoodShop[];
  onOpenScanner: () => void;
  onSelectScanResult: (scan: FoodScanResult) => void;
  onSelectShop: (shop: FoodShop) => void;
  onNavigate: (screen: AppScreen) => void;
  t: Record<string, string>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userName = 'Harshal',
  userAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  unreadNotificationsCount = 2,
  recentScans,
  nearbyShops,
  onOpenScanner,
  onSelectScanResult,
  onSelectShop,
  onNavigate,
  t,
}) => {
  return (
    <div className="flex-1 overflow-y-auto pb-6 bg-[#FAF7F2]">
      {/* Top App Bar with Greeting, Avatar & Notifications */}
      <div className="bg-white px-5 pt-4 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('profile')}
            className="relative focus:outline-hidden"
          >
            <img
              src={userAvatar}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/30 shadow-xs"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white"></span>
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
              {t.greeting || `Good Morning, ${userName} 👋`}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Eat smarter with FoodCheck AI
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('notifications')}
          className="relative w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
          )}
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Main Hero Card — The visual focus */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white p-5 shadow-lg shadow-orange-500/25">
          {/* Subtle background decorative shapes */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute right-4 top-4 opacity-15">
            <ShieldCheck size={90} strokeWidth={1.5} />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-amber-100 text-[11px] font-semibold tracking-wide backdrop-blur-xs mb-2.5 border border-white/20">
              <Sparkles size={12} className="text-amber-200" />
              <span>AI-Powered Safety Engine</span>
            </div>

            <h2 className="text-2xl font-black tracking-tight leading-tight">
              {t.heroTitle || 'Is your food safe?'}
            </h2>

            <p className="text-xs text-amber-50 font-medium mt-1 mb-5 leading-relaxed max-w-[280px]">
              {t.heroSubtext || 'Scan your food and get an AI-based safety assessment.'}
            </p>

            {/* BIGGEST CTA ON SCREEN: [ 📷 Scan Food ] */}
            <button
              onClick={onOpenScanner}
              className="w-full py-4 px-6 rounded-2xl bg-white text-orange-950 hover:bg-orange-50 active:scale-[0.98] font-black text-base shadow-xl shadow-black/15 flex items-center justify-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera size={22} strokeWidth={2.4} />
              </div>
              <span className="tracking-tight text-orange-950">
                {t.scanFoodBtn || '📷 Scan Food'}
              </span>
              <ArrowRight size={18} className="text-orange-600 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-center text-[11px] text-amber-100/90 font-medium mt-2.5">
              {t.scanSubtext || 'Scan packaged food or street food'}
            </p>
          </div>
        </div>

        {/* Quick Actions — Three Compact Cards */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.quickActions || 'Quick Actions'}
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {/* 1. Scan Food */}
            <button
              onClick={onOpenScanner}
              className="bg-white hover:bg-amber-50/60 p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center gap-2 transition-all active:scale-95 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Camera size={20} strokeWidth={2.2} />
              </div>
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {t.actionScan || 'Scan Food'}
              </span>
            </button>

            {/* 2. Nearby Food */}
            <button
              onClick={() => onNavigate('map')}
              className="bg-white hover:bg-amber-50/60 p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center gap-2 transition-all active:scale-95 group"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <MapPin size={20} strokeWidth={2.2} />
              </div>
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {t.actionNearby || 'Nearby Food'}
              </span>
            </button>

            {/* 3. Food Reviews */}
            <button
              onClick={() => onNavigate('review_create')}
              className="bg-white hover:bg-amber-50/60 p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center gap-2 transition-all active:scale-95 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <MessageSquareHeart size={20} strokeWidth={2.2} />
              </div>
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {t.actionReviews || 'Food Reviews'}
              </span>
            </button>
          </div>
        </div>

        {/* Recent Scans Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.recentScans || 'Recent Scans'}
            </h3>
            <span className="text-[11px] font-semibold text-orange-600">
              {recentScans.length} Scanned
            </span>
          </div>

          <div className="space-y-2.5">
            {recentScans.slice(0, 3).map((scan) => {
              const scoreBadgeClass =
                scan.safetyScore >= 7.5
                  ? 'bg-amber-100 text-amber-900 border-amber-300/80'
                  : scan.safetyScore >= 6.0
                  ? 'bg-orange-100 text-orange-900 border-orange-300/80'
                  : 'bg-red-100 text-red-800 border-red-300/60';

              return (
                <div
                  key={scan.id}
                  onClick={() => onSelectScanResult(scan)}
                  className="bg-white hover:border-amber-300/80 p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 transition-all cursor-pointer hover:shadow-md"
                >
                  <img
                    src={scan.imageUrl}
                    alt={scan.foodName}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {scan.foodType === 'packaged' ? 'Packaged' : 'Street Food'}
                      </span>
                      <span className="text-[11px] text-slate-400">· {scan.scanDate}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {scan.foodName}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {scan.riskLabel}
                    </p>
                  </div>

                  {/* Safety Score Pill */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <div className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 ${scoreBadgeClass}`}>
                      <ShieldCheck size={13} strokeWidth={2.5} />
                      <span>{scan.safetyScore}/10</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium mt-1">
                      Safety Score
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nearby Food Section — Horizontal Scroll */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.nearbyFood || 'Nearby Food'}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Verified hygiene & community ratings
              </p>
            </div>
            <button
              onClick={() => onNavigate('map')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>See Map</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
            {nearbyShops.map((shop) => (
              <div
                key={shop.id}
                onClick={() => onSelectShop(shop)}
                className="w-56 flex-shrink-0 bg-white hover:border-amber-300/80 rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden cursor-pointer transition-all hover:shadow-md"
              >
                <div className="relative h-28 w-full bg-slate-100">
                  <img
                    src={shop.imageUrl}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Status Badge */}
                  <span
                    className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs ${
                      shop.isOpen
                        ? 'bg-amber-500 text-slate-950 font-extrabold'
                        : 'bg-slate-700/80 text-slate-200'
                    }`}
                  >
                    {shop.isOpen ? '🟢 Open' : 'Closed'}
                  </span>

                  {/* Rating pill */}
                  <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-xs text-slate-800 px-2 py-0.5 rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-xs">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    <span>{shop.rating}</span>
                  </div>
                </div>

                <div className="p-3">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {shop.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {shop.category}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1 font-semibold text-orange-700">
                      <MapPin size={12} />
                      {shop.distance}
                    </span>
                    <span className="text-slate-400 font-medium">
                      Hygiene {shop.hygieneRating}★
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
