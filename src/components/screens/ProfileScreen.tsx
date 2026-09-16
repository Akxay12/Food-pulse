import React, { useState } from 'react';
import { Award, Star, Lock, CheckCircle2, ChevronRight, Globe, Bell, Shield, HelpCircle, User, Store, LogOut } from 'lucide-react';
import { UserBadge, AppScreen, FoodScanResult, ShopReview, FoodVideo } from '../../types';

interface ProfileScreenProps {
  name: string;
  username: string;
  avatarUrl: string;
  badges: UserBadge[];
  reviewsCount: number;
  videosCount: number;
  likesCount: number;
  onNavigate: (screen: AppScreen) => void;
  onSwitchRole: () => void;
  onLogout: () => void;
  recentScans: FoodScanResult[];
  videos: FoodVideo[];
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  name = 'Harshal Lad',
  username = '@harshal',
  avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  badges,
  reviewsCount = 24,
  videosCount = 7,
  likesCount = 143,
  onNavigate,
  onSwitchRole,
  onLogout,
  recentScans,
  videos
}) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'reviews' | 'videos'>('badges');

  // Interactive engagement simulator to show how badge locks/unlocks
  const [currentLikes, setCurrentLikes] = useState<number>(likesCount);

  const isSuperiorRaterUnlocked = currentLikes >= 100;

  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F2] text-slate-900 overflow-y-auto select-none pb-12">
      {/* Top Profile Header Card */}
      <div className="bg-white p-5 border-b border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={avatarUrl}
              alt={name}
              className="w-18 h-18 rounded-full object-cover ring-4 ring-amber-500/20 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white p-1 rounded-full border-2 border-white shadow-xs">
              <CheckCircle2 size={13} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-slate-900 tracking-tight truncate">
              {name}
            </h2>
            <p className="text-xs text-orange-600 font-bold tracking-tight">
              {username}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Food Safety Contributor & Vlogger
            </p>
          </div>
        </div>

        {/* User Engagement Stats */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-center">
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
            <span className="text-base font-black text-slate-900 block">
              {reviewsCount}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Reviews
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
            <span className="text-base font-black text-slate-900 block">
              {videosCount}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Videos
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
            <span className="text-base font-black text-orange-600 block">
              {currentLikes}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Helpful Likes
            </span>
          </div>
        </div>

        {/* Active Badges Highlight Ribbon */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {/* Badge 1: Food Vlogger */}
          <div className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-2.5 rounded-2xl flex items-center gap-2.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base shadow-xs">
              🏅
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-slate-900 block truncate">
                Food Vlogger
              </span>
              <span className="text-[10px] text-amber-900/80 font-bold block truncate">
                {videosCount} food videos shared
              </span>
            </div>
          </div>

          {/* Badge 2: Superior Rater */}
          <div
            className={`flex-1 border p-2.5 rounded-2xl flex items-center gap-2.5 shadow-2xs transition-all ${
              isSuperiorRaterUnlocked
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                : 'bg-slate-100 border-slate-200 opacity-60'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shadow-xs ${
                isSuperiorRaterUnlocked
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-300 text-slate-600'
              }`}
            >
              {isSuperiorRaterUnlocked ? '⭐' : <Lock size={16} />}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-slate-900 block truncate">
                Superior Rater
              </span>
              <span className="text-[10px] text-slate-600 font-bold block truncate">
                {isSuperiorRaterUnlocked ? 'Active (100+ likes)' : '🔒 Badge Locked'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Badges | Reviews | Videos */}
      <div className="bg-white border-b border-slate-200/80 px-4 flex items-center justify-around sticky top-0 z-30 shadow-2xs">
        <button
          onClick={() => setActiveTab('badges')}
          className={`py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'badges'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Badges & Rewards
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'reviews'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Reviews ({reviewsCount})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'videos'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Videos ({videosCount})
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-4">
        {activeTab === 'badges' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Community Gamification
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                Badges depend on active engagement
              </span>
            </div>

            {/* Badge 1 Details: Food Vlogger */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center text-2xl flex-shrink-0">
                  🏅
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">
                      Food Vlogger
                    </h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      UNLOCKED
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Shared more than 5 food discovery videos with the community.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">
                      Status: <strong>{videosCount} food videos shared</strong>
                    </span>
                    <span className="text-orange-600 font-bold">Goal 5/5 met</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badge 2 Details: Superior Rater */}
            <div
              className={`rounded-2xl border p-4 shadow-xs transition-all ${
                isSuperiorRaterUnlocked
                  ? 'bg-white border-slate-200/80'
                  : 'bg-slate-100/80 border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    isSuperiorRaterUnlocked
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-200 text-slate-500 border border-slate-300'
                  }`}
                >
                  {isSuperiorRaterUnlocked ? '⭐' : '🔒'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">
                      Superior Rater
                    </h4>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isSuperiorRaterUnlocked
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSuperiorRaterUnlocked ? 'UNLOCKED' : 'LOCKED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {isSuperiorRaterUnlocked
                      ? 'Your reviews are helping the community. Maintain 100+ helpful likes to keep this active.'
                      : 'Badge Locked: Engagement condition must maintain 100+ community helpful likes.'}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">
                      Current Likes: <strong>{currentLikes} / 100</strong>
                    </span>
                    <button
                      onClick={() => setCurrentLikes(currentLikes >= 100 ? 85 : 143)}
                      className="text-[10px] font-bold text-orange-600 hover:underline bg-amber-50 px-2 py-0.5 rounded-md"
                    >
                      [Demo Toggle Engagement]
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Published Reviews
            </h3>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Shree Snacks & Sweets</span>
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-amber-500" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                “Food was fresh and the stall was impeccably clean. Hot vada served straight out of filtered groundnut oil.”
              </p>
              <div className="mt-2 text-[11px] text-orange-600 font-bold">
                👍 126 community foodies found this helpful
              </div>
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Food Vlog Clips
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {videos.map((v) => (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="h-24 bg-slate-900 relative">
                    <img src={v.thumbnailUrl} alt={v.foodName} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      ❤️ {v.likes}
                    </span>
                  </div>
                  <div className="p-2">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{v.foodName}</h5>
                    <span className="text-[10px] text-slate-400">{v.shopName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Section */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Account Settings
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
            {/* Language */}
            <button
              onClick={() => onNavigate('language')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Globe size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Language</span>
                  <span className="text-[10px] text-slate-400">English, हिन्दी, मराठी + 5 more</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => onNavigate('notifications')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Notifications</span>
                  <span className="text-[10px] text-slate-400">Badge alerts & scan reports</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            {/* Privacy */}
            <button
              onClick={() => alert('Privacy & Data: Local device state with opt-in cloud sync.')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Privacy</span>
                  <span className="text-[10px] text-slate-400">Camera permissions & data</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            {/* Switch to Shopkeeper Mode */}
            <button
              onClick={onSwitchRole}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Store size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Switch to Shopkeeper Mode</span>
                  <span className="text-[10px] text-slate-400">Manage stall, timings & live menu</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            {/* Help & Support */}
            <button
              onClick={() => alert('FoodCheck Help: Built for college hackathon. AI Food Safety checking & discovery.')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <HelpCircle size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Help & Guidelines</span>
                  <span className="text-[10px] text-slate-400">Food safety assessment FAQs</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
