import React, { useState } from 'react';
import { Store, Star, MessageSquare, Eye, PlusCircle, MapPin, Clock, Edit3, ArrowRight, CheckCircle2, UserCheck, ShieldCheck } from 'lucide-react';
import { FoodShop, AppScreen } from '../../types';

interface ShopkeeperDashboardProps {
  currentShop: FoodShop | null;
  shopkeeperName?: string;
  shopkeeperEmail?: string;
  role?: string;
  onNavigate: (screen: AppScreen) => void;
  onToggleShopStatus: () => void;
  onSwitchToUser: () => void;
}

export const ShopkeeperDashboard: React.FC<ShopkeeperDashboardProps> = ({
  currentShop,
  shopkeeperName = 'Shopkeeper',
  shopkeeperEmail,
  role = 'shopkeeper',
  onNavigate,
  onToggleShopStatus,
  onSwitchToUser
}) => {
  const [isOpen, setIsOpen] = useState(currentShop ? currentShop.isOpen : true);

  const handleStatusToggle = () => {
    setIsOpen(!isOpen);
    onToggleShopStatus();
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F2] text-slate-900 overflow-y-auto select-none pb-12">
      {/* Top Header */}
      <div className="bg-white px-5 pt-4 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="min-w-0 flex-1 mr-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-orange-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              🏪 {role.toUpperCase()}
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight mt-1 truncate">
            Welcome, {shopkeeperName} 👋
          </h1>
          {shopkeeperEmail && (
            <p className="text-[11px] text-slate-400 truncate">{shopkeeperEmail}</p>
          )}
        </div>

        <button
          onClick={onSwitchToUser}
          className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors flex-shrink-0"
        >
          Switch to User
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Shop Open / Closed Status Toggle Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isOpen ? 'bg-amber-100 text-orange-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Store size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold block">Current Status</span>
              <span
                className={`text-sm font-black tracking-tight ${
                  isOpen ? 'text-orange-600' : 'text-slate-600'
                }`}
              >
                {isOpen ? '🟢 SHOP OPEN' : '🔴 SHOP CLOSED'}
              </span>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleStatusToggle}
            className={`w-14 h-8 rounded-full transition-colors relative p-1 cursor-pointer ${
              isOpen ? 'bg-orange-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                isOpen ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>

        {/* Dashboard Metric Cards: My Shop, Ratings, Reviews, Views */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: My Shop */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-orange-600 flex items-center justify-center mb-2">
              <Store size={16} />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              My Stall
            </span>
            <span className="text-sm font-extrabold text-slate-900 truncate block mt-0.5">
              {currentShop ? currentShop.name : 'No stall registered'}
            </span>
            <span className="text-[10px] text-orange-600 font-semibold">
              {currentShop ? 'Live on FoodCheck Map' : 'Tap below to register'}
            </span>
          </div>

          {/* Card 2: Ratings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
              <Star size={16} className={currentShop && currentShop.rating > 0 ? "fill-amber-500 text-amber-500" : "text-slate-300"} />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Customer Rating
            </span>
            <span className="text-base font-black text-slate-900 block mt-0.5">
              {currentShop && currentShop.rating > 0 ? `⭐ ${currentShop.rating} / 5` : 'No ratings yet'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {currentShop && currentShop.hygieneRating > 0 ? `Hygiene ${currentShop.hygieneRating}★` : 'Hygiene: Not rated'}
            </span>
          </div>

          {/* Card 3: Reviews */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
              <MessageSquare size={16} />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Reviews
            </span>
            <span className="text-lg font-black text-slate-900 block mt-0.5">
              {currentShop ? (currentShop.reviewsCount ?? currentShop.reviews?.length ?? 0) : 0}
            </span>
            <span className="text-[10px] text-orange-600 font-semibold">
              {currentShop && (currentShop.reviewsCount || currentShop.reviews?.length) ? 'Verified reviews' : 'No reviews yet'}
            </span>
          </div>

          {/* Card 4: Status / Visibility */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
              <Eye size={16} />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Map Status
            </span>
            <span className="text-sm font-black text-slate-900 block mt-0.5 truncate">
              {currentShop ? (currentShop.isOpen ? '🟢 Open Now' : '🔴 Closed') : 'Not Published'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {currentShop ? 'FoodCheck Stall' : 'Ready to setup'}
            </span>
          </div>
        </div>

        {/* Primary Action Button: "Setup My Shop" */}
        <button
          onClick={() => onNavigate('shopkeeper_setup')}
          className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-black text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <PlusCircle size={20} />
          <span>Setup My Shop / Register Stall</span>
        </button>

        {/* Shopkeeper Profile View Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Stall Listing Preview
              </h3>
              <p className="text-[10px] text-slate-400">
                How users see your food stall on the shared map
              </p>
            </div>
            <button
              onClick={() => onNavigate('shopkeeper_profile')}
              className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline"
            >
              <span>Manage Profile</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {!currentShop ? (
            <div className="border border-dashed border-amber-300 rounded-xl p-4 bg-amber-50/50 text-center">
              <Store size={26} className="text-amber-600 mx-auto mb-1.5" />
              <h4 className="text-xs font-bold text-slate-800">Shop not setup yet</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 mb-3">
                Register your food stall, operating hours, and live menu.
              </p>
              <button
                onClick={() => onNavigate('shopkeeper_setup')}
                className="py-1.5 px-3.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-xs hover:from-amber-600 hover:to-orange-600 cursor-pointer"
              >
                Setup My Shop
              </button>
            </div>
          ) : (
            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 flex items-center gap-3">
              <img
                src={currentShop.imageUrl}
                alt={currentShop.name}
                className="w-14 h-14 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {currentShop.name}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {currentShop.category}
                </p>
                <span className="text-[10px] text-orange-600 font-semibold mt-0.5 block">
                  {currentShop.openingTime} - {currentShop.closingTime}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Management Shortcuts */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Stall Management
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigate('shopkeeper_setup')}
              className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-left transition-colors"
            >
              <Edit3 size={15} className="text-orange-600 mb-1" />
              <span className="text-xs font-bold text-slate-800 block">Update Menu</span>
              <span className="text-[10px] text-slate-400">Add daily specials</span>
            </button>
            <button
              onClick={() => onNavigate('shopkeeper_profile')}
              className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-left transition-colors"
            >
              <Clock size={15} className="text-amber-600 mb-1" />
              <span className="text-xs font-bold text-slate-800 block">Update Timing</span>
              <span className="text-[10px] text-slate-400">Set working hours</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
