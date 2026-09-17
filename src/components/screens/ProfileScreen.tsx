import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Camera,
  Star,
  Film,
  Award,
  Globe,
  Store,
  Shield,
  KeyRound,
  LogOut,
  X,
  Check,
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  ThumbsUp
} from 'lucide-react';
import { UserBadge, AppScreen, FoodScanResult, FoodVideo, ReviewDocument, SupportedLanguage } from '../../types';
import { reviewService } from '../../services/reviewService';
import { videoService } from '../../services/videoService';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { SUPPORTED_LANGUAGES } from '../../utils/translations';

interface ProfileScreenProps {
  userId?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  badges: UserBadge[];
  reviewsCount?: number;
  videosCount?: number;
  likesCount?: number;
  onNavigate: (screen: AppScreen) => void;
  onSwitchRole: () => void;
  onLogout: () => void;
  recentScans: FoodScanResult[];
  videos?: FoodVideo[];
  onSelectScanResult?: (scan: FoodScanResult) => void;
  onAvatarUpdated?: (newUrl: string) => void;
  currentLanguage?: SupportedLanguage;
  onSelectLanguage?: (lang: SupportedLanguage) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userId = '',
  name = 'FoodCheck User',
  username = '',
  email = '',
  role = 'user',
  avatarUrl = '',
  badges = [],
  reviewsCount: propReviewsCount,
  videosCount: propVideosCount,
  likesCount: propLikesCount,
  onNavigate,
  onSwitchRole,
  onLogout,
  recentScans = [],
  videos: propVideos = [],
  onSelectScanResult,
  onAvatarUpdated,
  currentLanguage = 'en',
  onSelectLanguage
}) => {
  // Content Tab State (Reviews | Videos | Scans)
  const [activeContentTab, setActiveContentTab] = useState<'reviews' | 'videos' | 'scans'>('reviews');

  // Real User Data fetched from Firebase
  const [userReviews, setUserReviews] = useState<ReviewDocument[]>([]);
  const [userVideos, setUserVideos] = useState<FoodVideo[]>([]);
  const [totalHelpfulLikes, setTotalHelpfulLikes] = useState<number>(propLikesCount || 0);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(true);

  // Avatar upload state
  const [localAvatar, setLocalAvatar] = useState<string>(avatarUrl);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Settings Panel & Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsView, setSettingsView] = useState<'menu' | 'language' | 'privacy' | 'password'>('menu');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Sync avatar when prop changes
  useEffect(() => {
    if (avatarUrl) {
      setLocalAvatar(avatarUrl);
    }
  }, [avatarUrl]);

  // Fetch real reviews and real videos authored by this user
  useEffect(() => {
    let isMounted = true;
    const loadUserData = async () => {
      if (!userId) {
        setIsLoadingContent(false);
        return;
      }
      setIsLoadingContent(true);
      try {
        const [reviewsData, userVids] = await Promise.all([
          reviewService.getUserReviewsAndLikes(userId),
          videoService.getUserVideos(userId)
        ]);

        if (isMounted) {
          setUserReviews(reviewsData.reviews || []);
          setTotalHelpfulLikes(reviewsData.totalLikes || 0);
          setUserVideos(userVids || []);
        }
      } catch (err) {
        console.warn('Error loading real user profile data:', err);
      } finally {
        if (isMounted) {
          setIsLoadingContent(false);
        }
      }
    };

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Handle Profile Photo Upload via Camera or Gallery
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setAvatarError('Image file size must be less than 10MB.');
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarError(null);

    try {
      const newPhotoUrl = await userService.uploadAvatar(file, userId || 'user');
      setLocalAvatar(newPhotoUrl);
      if (onAvatarUpdated) {
        onAvatarUpdated(newPhotoUrl);
      }
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to upload profile photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle Firebase Auth Password Update
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password updated successfully in Firebase Authentication!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSettingsView('menu');
        setPasswordSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password. Please check your credentials.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Real Counts matching actual user data
  const realReviewsCount = userReviews.length > 0 ? userReviews.length : (propReviewsCount || 0);
  const realVideosCount = userVideos.length > 0 ? userVideos.length : (propVideosCount || 0);
  
  // Filter strictly earned badges (no hardcoding, no permanently unlocked fake badges)
  const earnedBadges = badges.filter((b) => b.isUnlocked && !b.isLockedDueToCondition);
  const realBadgesCount = earnedBadges.length;

  return (
    <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden bg-[#FAF7F2] text-slate-900 select-none">
      {/* Scrollable Profile Content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-20">
        {/* 1. INSTAGRAM-STYLE PROFILE HEADER */}
      <div className="bg-white p-5 border-b border-slate-200/80 shadow-2xs">
        {/* Top Header Row: Settings Button in top right */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            Profile
          </span>
          <button
            onClick={() => {
              setSettingsView('menu');
              setIsSettingsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer active:scale-95 border border-slate-200"
            title="Open Settings"
          >
            <Settings size={14} className="text-slate-600" />
            <span>Settings</span>
          </button>
        </div>

        {/* Profile Avatar & 3-Column Stats (Instagram Pattern) */}
        <div className="flex items-center gap-6">
          {/* Avatar with Camera Overlay */}
          <div className="relative flex-shrink-0">
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />

            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-20 h-20 rounded-full overflow-hidden ring-3 ring-orange-500/30 shadow-md cursor-pointer relative group bg-slate-100 flex items-center justify-center"
              title="Tap to change profile photo"
            >
              {localAvatar ? (
                <img
                  src={localAvatar}
                  alt={name}
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-2xl flex items-center justify-center">
                  {(name || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                  <Loader2 size={20} className="animate-spin text-orange-400" />
                </div>
              )}

              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <Camera size={18} />
              </div>
            </div>

            {/* Quick Camera Badge on bottom right of avatar */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-1.5 rounded-full border-2 border-white shadow-xs cursor-pointer active:scale-90 transition-transform"
              title="Upload new photo"
            >
              <Camera size={12} />
            </button>
          </div>

          {/* 3-Column Real Stats */}
          <div className="flex-1 grid grid-cols-3 gap-1 text-center">
            <div className="flex flex-col items-center">
              <span className="text-base font-black text-slate-900 leading-tight">
                {realReviewsCount}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Reviews
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-base font-black text-slate-900 leading-tight">
                {realVideosCount}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Videos
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-base font-black text-orange-600 leading-tight">
                {realBadgesCount}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Badges
              </span>
            </div>
          </div>
        </div>

        {/* User Identity & Role Pill */}
        <div className="mt-3.5 space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              {name || 'FoodCheck Contributor'}
            </h2>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                role === 'shopkeeper'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {role === 'shopkeeper' ? '🏪 Shopkeeper' : '👤 Verified Foodie'}
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            {email || (username ? `@${username}` : '')}
          </p>
        </div>

        {/* Action Button Row */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80"
          >
            <Camera size={13} />
            <span>Change Photo</span>
          </button>

          <button
            onClick={() => {
              setSettingsView('menu');
              setIsSettingsOpen(true);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80"
          >
            <Settings size={13} />
            <span>Account Settings</span>
          </button>
        </div>

        {avatarError && (
          <div className="mt-2.5 p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-center gap-1.5">
            <AlertCircle size={13} className="flex-shrink-0" />
            <span>{avatarError}</span>
          </div>
        )}
      </div>

      {/* 2. HORIZONTAL EARNED BADGES ROW */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Earned Badges ({earnedBadges.length})
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            Dynamic achievements
          </span>
        </div>

        {earnedBadges.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-amber-300/80 shadow-2xs text-slate-800 flex-shrink-0"
              >
                <span className="text-base">{badge.icon || '🏅'}</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight">
                    {badge.title}
                  </h4>
                  <span className="text-[10px] text-amber-700 font-semibold block">
                    {badge.unlockedDetail || 'Unlocked Achievement'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 text-center text-xs text-slate-400">
            <Award size={18} className="mx-auto mb-1 text-slate-300" />
            <span>No badges earned yet. Review stalls and share food videos to earn achievements!</span>
          </div>
        )}
      </div>

      {/* 3. USER CONTENT TABS: Reviews | Videos | Scans */}
      <div className="mt-2 bg-white border-y border-slate-200/80 sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center justify-around px-2">
          <button
            onClick={() => setActiveContentTab('reviews')}
            className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeContentTab === 'reviews'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Reviews ({userReviews.length})
          </button>
          <button
            onClick={() => setActiveContentTab('videos')}
            className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeContentTab === 'videos'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Videos ({userVideos.length})
          </button>
          <button
            onClick={() => setActiveContentTab('scans')}
            className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeContentTab === 'scans'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Scans ({recentScans.length})
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="p-4 space-y-3">
        {isLoadingContent ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={22} className="animate-spin text-orange-500" />
            <span className="text-xs font-medium">Loading user activity…</span>
          </div>
        ) : (
          <>
            {/* Reviews Content */}
            {activeContentTab === 'reviews' && (
              <div className="space-y-3">
                {userReviews.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
                    <Star size={32} className="mx-auto mb-2 text-slate-300" />
                    <h4 className="text-xs font-bold text-slate-700 mb-0.5">No reviews authored yet</h4>
                    <p className="text-[11px] text-slate-400">
                      Visit a street food stall and share your hygiene and freshness experience!
                    </p>
                  </div>
                ) : (
                  userReviews.map((rev) => (
                    <div
                      key={rev.reviewId}
                      className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {rev.targetType === 'shop' ? 'Stall Review' : 'Food Review'}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                          </span>
                        </div>
                        <div className="flex items-center text-amber-500">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} size={13} className="fill-amber-500" />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        “{rev.reviewText}”
                      </p>

                      {rev.photoUrl && (
                        <img
                          src={rev.photoUrl}
                          alt="Review attachment"
                          className="w-24 h-18 rounded-xl object-cover ring-1 ring-slate-200 mt-1"
                        />
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1 font-bold text-orange-600">
                          <ThumbsUp size={13} className="fill-orange-500" />
                          <span>{rev.likesCount || 0} helpful likes received</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Videos Content */}
            {activeContentTab === 'videos' && (
              <div>
                {userVideos.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
                    <Film size={32} className="mx-auto mb-2 text-slate-300" />
                    <h4 className="text-xs font-bold text-slate-700 mb-0.5">No food videos uploaded yet</h4>
                    <p className="text-[11px] text-slate-400">
                      Share your street food clips in the Videos tab to earn the Food Vlogger badge!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {userVideos.map((v) => (
                      <div
                        key={v.id}
                        className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs"
                      >
                        <div className="h-28 bg-slate-900 relative">
                          <img
                            src={v.thumbnailUrl}
                            alt={v.foodName}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            ❤️ {v.likes}
                          </span>
                        </div>
                        <div className="p-2.5">
                          <h5 className="text-xs font-bold text-slate-900 truncate">{v.foodName}</h5>
                          <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                            {v.shopName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Private Food Scans Content */}
            {activeContentTab === 'scans' && (
              <div className="space-y-2.5">
                {recentScans.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
                    <Camera size={32} className="mx-auto mb-2 text-slate-300" />
                    <h4 className="text-xs font-bold text-slate-700 mb-0.5">No food safety scans recorded</h4>
                    <p className="text-[11px] text-slate-400">
                      Use the Food Scanner to evaluate fresh street food or packaged foods.
                    </p>
                  </div>
                ) : (
                  recentScans.map((scan) => (
                    <div
                      key={scan.id}
                      onClick={() => onSelectScanResult && onSelectScanResult(scan)}
                      className="bg-white hover:border-amber-300 p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3 transition-all cursor-pointer"
                    >
                      <img
                        src={scan.imageUrl}
                        alt={scan.foodName}
                        className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          {scan.foodType === 'packaged' ? 'Packaged' : 'Street Food'} · {scan.scanDate}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                          {scan.foodName}
                        </h4>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {scan.riskLabel}
                        </span>
                      </div>
                      <div className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black">
                        {scan.safetyScore}/10
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
      </div>
      {/* End Scrollable Profile Content */}

      {/* 4. CONSOLIDATED SETTINGS DRAWER / MODAL (Constrained strictly inside mobile frame) */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end overflow-hidden animate-fade-in">
          {/* Backdrop Tap Area */}
          <div
            className="flex-1 min-h-[12%]"
            onClick={() => {
              setIsSettingsOpen(false);
              setSettingsView('menu');
              setPasswordError(null);
              setPasswordSuccess(null);
            }}
          />

          {/* Mobile Bottom Sheet Card */}
          <div className="bg-white rounded-t-3xl max-h-[85%] flex flex-col shadow-2xl border-t border-slate-200 overflow-hidden animate-slide-up">
            {/* Sheet Handle */}
            <div className="pt-2.5 pb-0.5 flex justify-center">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                {settingsView !== 'menu' && (
                  <button
                    onClick={() => {
                      setSettingsView('menu');
                      setPasswordError(null);
                      setPasswordSuccess(null);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <h3 className="text-sm font-black text-slate-900">
                  {settingsView === 'menu' && 'Settings & Preferences'}
                  {settingsView === 'language' && 'Select App Language'}
                  {settingsView === 'privacy' && 'Privacy & Security'}
                  {settingsView === 'password' && 'Change Password'}
                </h3>
              </div>

              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setSettingsView('menu');
                  setPasswordError(null);
                  setPasswordSuccess(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3 pb-8">
              {/* SUBVIEW: MAIN MENU */}
              {settingsView === 'menu' && (
                <div className="divide-y divide-slate-100 rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-2xs">
                  {/* Language */}
                  <button
                    onClick={() => setSettingsView('language')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Globe size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Language / भाषा</span>
                        <span className="text-[11px] text-slate-400">
                          {SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage)?.name || 'English'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>

                  {/* Switch to Shopkeeper Mode / Switch to User */}
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onSwitchRole();
                    }}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-orange-600 flex items-center justify-center">
                        <Store size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {role === 'shopkeeper' ? 'Switch to User Mode' : 'Switch to Shopkeeper Mode'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {role === 'shopkeeper' ? 'Browse FoodCheck as a consumer' : 'Manage your food stall & menu'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>

                  {/* Privacy & Security */}
                  <button
                    onClick={() => setSettingsView('privacy')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Shield size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Privacy & Security</span>
                        <span className="text-[11px] text-slate-400">Data encryption & scan history</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>

                  {/* Change Password */}
                  <button
                    onClick={() => setSettingsView('password')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <KeyRound size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Change Password</span>
                        <span className="text-[11px] text-slate-400">Firebase Authentication update</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onLogout();
                    }}
                    className="w-full p-4 flex items-center justify-between hover:bg-red-50/50 transition-colors text-left cursor-pointer text-red-600"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                        <LogOut size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">Log Out</span>
                        <span className="text-[11px] text-red-400">Sign out of your session</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-red-400" />
                  </button>
                </div>
              )}

              {/* SUBVIEW: LANGUAGE */}
              {settingsView === 'language' && (
                <div className="divide-y divide-slate-100 rounded-2xl bg-white border border-slate-200/80 overflow-hidden">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = currentLanguage === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          if (onSelectLanguage) {
                            onSelectLanguage(lang.code);
                          }
                          setSettingsView('menu');
                        }}
                        className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                          isSelected ? 'bg-orange-50/60 font-bold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <span className="text-xs text-slate-900 block">{lang.name}</span>
                          <span className="text-[11px] text-slate-400">{lang.nativeName}</span>
                        </div>
                        {isSelected && <Check size={16} className="text-orange-600" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* SUBVIEW: PRIVACY & SECURITY */}
              {settingsView === 'privacy' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Shield size={15} className="text-emerald-600" />
                      <span>Private Food Safety Scans</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      All your food scans, photos, and safety score reports are stored securely in your private Firestore collection. Only your authenticated account has read and write access.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Shield size={15} className="text-blue-600" />
                      <span>Device Location Access</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Your real GPS coordinates from Capacitor Geolocation are only used in real time to calculate distances to nearby stalls and render your position on the map. Coordinates are never saved or sold.
                    </p>
                  </div>
                </div>
              )}

              {/* SUBVIEW: CHANGE PASSWORD */}
              {settingsView === 'password' && (
                <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        New Password (minimum 6 characters)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  {passwordError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Updating Password…</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={15} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
