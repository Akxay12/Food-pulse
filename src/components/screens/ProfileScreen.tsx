import React, { useState } from 'react';
import { Award, Star, Lock, CheckCircle2, ChevronRight, Globe, Bell, Shield, HelpCircle, User, Store, LogOut, Camera, Film, Flame } from 'lucide-react';
import { UserBadge, AppScreen, FoodScanResult, FoodVideo } from '../../types';

interface ProfileScreenProps {
  name: string;
  username: string;
  email?: string;
  role?: string;
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
  onSelectScanResult?: (scan: FoodScanResult) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  name = 'Harshal Lad',
  username = '@harshal',
  email,
  role = 'user',
  avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  badges,
  reviewsCount = 24,
  videosCount = 7,
  likesCount = 143,
  onNavigate,
  onSwitchRole,
  onLogout,
  recentScans,
  videos,
  onSelectScanResult
}) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'scans' | 'videos'>('badges');

  const vloggerBadge = badges.find((b) => b.id === 'vlogger') || {
    id: 'vlogger',
    title: 'Food Vlogger',
    description: 'Shared more than 5 food discovery videos.',
    isUnlocked: videosCount > 5,
    currentCount: videosCount,
    targetCount: 5
  };

  const superiorRaterBadge = badges.find((b) => b.id === 'rater') || {
    id: 'rater',
    title: 'Superior Rater',
    description: 'Your food reviews received 100+ helpful likes.',
    isUnlocked: likesCount >= 100,
    currentCount: likesCount,
    targetCount: 100
  };

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
            <p className="text-xs text-orange-600 font-bold tracking-tight truncate">
              {email || username}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {role === 'shopkeeper' ? '🏪 Shopkeeper Account' : '👤 Food Safety Contributor & Vlogger'}
            </p>
          </div>
        </div>

        {/* User Contribution Real Statistics */}
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
              {likesCount}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Helpful Likes
            </span>
          </div>
        </div>

        {/* Active Badges Highlight Ribbon */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {/* Badge 1: Food Vlogger */}
          <div
            className={`flex-1 border p-2.5 rounded-2xl flex items-center gap-2.5 shadow-2xs transition-all ${
              vloggerBadge.isUnlocked
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                : 'bg-slate-100 border-slate-200 opacity-70'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shadow-xs ${
                vloggerBadge.isUnlocked ? 'bg-amber-400 text-slate-950' : 'bg-slate-300 text-slate-600'
              }`}
            >
              🏅
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-slate-900 block truncate">
                Food Vlogger
              </span>
              <span className="text-[10px] text-amber-900/90 font-bold block truncate">
                {vloggerBadge.isUnlocked ? `${videosCount} videos shared` : `${videosCount}/5 videos`}
              </span>
            </div>
          </div>

          {/* Badge 2: Superior Rater */}
          <div
            className={`flex-1 border p-2.5 rounded-2xl flex items-center gap-2.5 shadow-2xs transition-all ${
              superiorRaterBadge.isUnlocked && !superiorRaterBadge.isLockedDueToCondition
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                : 'bg-slate-100 border-slate-200 opacity-70'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shadow-xs ${
                superiorRaterBadge.isUnlocked && !superiorRaterBadge.isLockedDueToCondition
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-300 text-slate-600'
              }`}
            >
              {superiorRaterBadge.isUnlocked && !superiorRaterBadge.isLockedDueToCondition ? '⭐' : <Lock size={16} />}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-slate-900 block truncate">
                Superior Rater
              </span>
              <span className="text-[10px] text-slate-600 font-bold block truncate">
                {superiorRaterBadge.isUnlocked && !superiorRaterBadge.isLockedDueToCondition
                  ? 'Active (100+ likes)'
                  : superiorRaterBadge.isLockedDueToCondition
                  ? '🔒 Locked (50+ req.)'
                  : `${likesCount}/100 likes`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Badges | Recent Scans | My Videos */}
      <div className="bg-white border-b border-slate-200/80 px-4 flex items-center justify-around sticky top-0 z-30 shadow-2xs">
        <button
          onClick={() => setActiveTab('badges')}
          className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'badges'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Badges & XP
        </button>
        <button
          onClick={() => setActiveTab('scans')}
          className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'scans'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Scan History ({recentScans.length})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
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
                Community Badges & Rewards
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                Derived from real contribution data
              </span>
            </div>

            {/* Badge 1 Details: Food Vlogger */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center text-2xl flex-shrink-0">
                  🏅
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">
                      Food Vlogger
                    </h4>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        vloggerBadge.isUnlocked
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {vloggerBadge.isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Upload more than 5 street food discovery videos to unlock this badge.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">
                      Progress: <strong>{videosCount} / 5 videos</strong>
                    </span>
                    <span className={vloggerBadge.isUnlocked ? 'text-orange-600 font-bold' : 'text-slate-400 font-semibold'}>
                      {vloggerBadge.isUnlocked ? 'Goal Achieved 🏅' : `${5 - videosCount} more needed`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badge 2 Details: Superior Rater */}
            <div
              className={`rounded-2xl border p-4 shadow-xs transition-all ${
                superiorRaterBadge.isUnlocked && !superiorRaterBadge.isLockedDueToCondition
                  ? 'bg-white border-slate-200/80'
                  : 'bg-slate-100/80 border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    superiorRaterBadge.isUnlocked && !superiorRaterBadge.isLockedDueToCondition
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-200 text-slate-500 border border-slate-300'
                  }`}
                >
                  {superiorRaterBadge.isUnlocked && !superiorRaterBadge.isLockedDueToCondition ? '⭐' : <Lock size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">
                      Superior Rater
                    </h4>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        superiorRaterBadge.isUnlocked && !superiorRaterBadge.isLockedDueToCondition
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {superiorRaterBadge.isUnlocked && !superiorRaterBadge.isLockedDueToCondition
                        ? 'UNLOCKED'
                        : 'LOCKED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {superiorRaterBadge.isUnlocked && !superiorRaterBadge.isLockedDueToCondition
                      ? 'Your reviews are helping the community. Maintain 100+ helpful likes and 50+ likes on new reviews to keep this active.'
                      : superiorRaterBadge.isLockedDueToCondition
                      ? superiorRaterBadge.lockExplanation || 'Badge Locked: Subsequent reviews must maintain at least 50 helpful likes.'
                      : 'Requires a community review to receive 100 or more helpful likes.'}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">
                      Helpful Likes: <strong>{likesCount} / 100</strong>
                    </span>
                    <span className="text-orange-600 font-bold">
                      {superiorRaterBadge.isUnlocked && !superiorRaterBadge.isLockedDueToCondition
                        ? 'Active ⭐'
                        : 'Locked 🔒'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scan History Tab */}
        {activeTab === 'scans' && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Private Food Safety Scans
            </h3>
            {recentScans.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-slate-200 p-6">
                <Camera size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No food scans recorded yet</p>
              </div>
            ) : (
              recentScans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => onSelectScanResult && onSelectScanResult(scan)}
                  className="bg-white hover:border-amber-300 p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all cursor-pointer"
                >
                  <img src={scan.imageUrl} alt={scan.foodName} className="w-14 h-14 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {scan.foodType === 'packaged' ? 'Packaged' : 'Street Food'} · {scan.scanDate}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">{scan.foodName}</h4>
                    <span className="text-[11px] text-slate-500">{scan.riskLabel}</span>
                  </div>
                  <div className="px-2 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black">
                    {scan.safetyScore}/10
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Uploaded Videos Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Food Vlog Clips
            </h3>
            {videos.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-slate-200 p-6">
                <Film size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No food videos uploaded yet</p>
              </div>
            ) : (
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
                      <span className="text-[10px] text-slate-400 truncate block">{v.shopName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Globe size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Language / भाषा</span>
                  <span className="text-[10px] text-slate-400">English, हिन्दी, मराठी + 5 more</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => onNavigate('notifications')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 text-left transition-colors cursor-pointer"
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

            {/* Switch to Shopkeeper Mode */}
            <button
              onClick={onSwitchRole}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 text-left transition-colors cursor-pointer"
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

            {/* Privacy */}
            <button
              onClick={() => alert('FoodCheck Privacy: Private scan history is accessible only by your authenticated account.')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Privacy & Security</span>
                  <span className="text-[10px] text-slate-400">Camera permissions & Firestore rules</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
