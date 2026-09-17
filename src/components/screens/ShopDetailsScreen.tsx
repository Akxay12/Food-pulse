import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Utensils,
  ThumbsUp,
  ThumbsDown,
  MessageSquareHeart,
  Share2,
  ShieldCheck,
  Trash2,
  Loader2,
  Store,
  Camera,
  Plus,
  Image as ImageIcon,
  X,
  Maximize2
} from 'lucide-react';
import { FoodShop, ShopReview } from '../../types';
import { reviewService } from '../../services/reviewService';
import { shopService } from '../../services/shopService';

interface ShopDetailsScreenProps {
  shop: FoodShop;
  currentUserId?: string;
  onBack: () => void;
  onWriteReview: (shopId: string) => void;
  onToggleLikeReview?: (shopId: string, reviewId: string) => void;
  onReviewReactionUpdated?: (shopId: string, reviewId: string, likesCount: number, dislikesCount: number, userReaction: 'like' | 'dislike' | null) => void;
  onOpenUserProfile?: (userId: string) => void;
}

interface StallPhotoItem {
  id: string;
  url: string;
  caption?: string;
  uploadedBy?: string;
  uploadedRole?: 'Shopkeeper' | 'Customer' | 'FoodCheck';
  date?: string;
}

export const ShopDetailsScreen: React.FC<ShopDetailsScreenProps> = ({
  shop,
  currentUserId,
  onBack,
  onWriteReview,
  onToggleLikeReview,
  onReviewReactionUpdated,
  onOpenUserProfile
}) => {
  // STRICTLY 2 TABS ONLY: 'ratings' and 'photos'
  const [activeTab, setActiveTab] = useState<'ratings' | 'photos'>('ratings');
  const [liveReviews, setLiveReviews] = useState<ShopReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  const [pendingReactions, setPendingReactions] = useState<Record<string, 'like' | 'dislike'>>({});
  const [aggregatedRatings, setAggregatedRatings] = useState({
    rating: typeof shop.rating === 'number' ? shop.rating : 0,
    foodQualityRating: typeof shop.foodQualityRating === 'number' ? shop.foodQualityRating : 0,
    hygieneRating: typeof shop.hygieneRating === 'number' ? shop.hygieneRating : 0,
    reviewsCount: shop.reviewsCount ?? shop.reviews?.length ?? 0
  });

  // Photo Upload & Lightbox state
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<StallPhotoItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load real reviews from Firestore
  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const fetched = await reviewService.getReviews(shop.id, undefined, currentUserId);
      if (fetched && fetched.length > 0) {
        setLiveReviews(
          fetched.map((f) => ({
            id: f.reviewId,
            shopId: f.targetId,
            userId: f.userId,
            userName: f.userName || 'Anonymous Foodie',
            userAvatar: f.userProfileImage || '',
            rating: f.rating,
            subRatings: f.subRatings,
            reviewText: f.reviewText,
            photoUrl: f.photoUrl,
            likeCount: f.likesCount || 0,
            dislikeCount: f.dislikesCount || 0,
            date: f.createdAt
              ? new Date(f.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : 'Recently',
            userLiked: f.userReaction === 'like',
            userDisliked: f.userReaction === 'dislike',
            createdAt: f.createdAt
          }))
        );

        // Compute live aggregate ratings from real reviews
        const aggr = await reviewService.calculateShopRatings(shop.id);
        setAggregatedRatings(aggr);
      } else {
        setLiveReviews([]);
        setAggregatedRatings({
          rating: 0,
          foodQualityRating: 0,
          hygieneRating: 0,
          reviewsCount: 0
        });
      }
    } catch {
      setLiveReviews([]);
      setAggregatedRatings({
        rating: 0,
        foodQualityRating: 0,
        hygieneRating: 0,
        reviewsCount: 0
      });
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [shop.id, currentUserId, shop.reviewsCount, shop.reviews?.length]);

  const handleLike = async (reviewId: string) => {
    if (!currentUserId) return;
    if (pendingReactions[reviewId]) return; // Concurrency protection against double-tapping

    // Immediate visual reaction feedback
    setPendingReactions((prev) => ({ ...prev, [reviewId]: 'like' }));

    try {
      const res = await reviewService.toggleLikeReview(reviewId, currentUserId);
      setLiveReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                likeCount: res.likesCount,
                dislikeCount: res.dislikesCount,
                userLiked: res.userReaction === 'like',
                userDisliked: false
              }
            : r
        )
      );
      if (onReviewReactionUpdated) {
        onReviewReactionUpdated(shop.id, reviewId, res.likesCount, res.dislikesCount, res.userReaction);
      }
    } catch (err) {
      console.warn('Like toggle failed:', err);
    } finally {
      setPendingReactions((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
    }
  };

  const handleDislike = async (reviewId: string) => {
    if (!currentUserId) return;
    if (pendingReactions[reviewId]) return; // Concurrency protection against double-tapping

    // Immediate visual reaction feedback
    setPendingReactions((prev) => ({ ...prev, [reviewId]: 'dislike' }));

    try {
      const res = await reviewService.toggleDislikeReview(reviewId, currentUserId);
      setLiveReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                likeCount: res.likesCount,
                dislikeCount: res.dislikesCount,
                userDisliked: res.userReaction === 'dislike',
                userLiked: false
              }
            : r
        )
      );
      if (onReviewReactionUpdated) {
        onReviewReactionUpdated(shop.id, reviewId, res.likesCount, res.dislikesCount, res.userReaction);
      }
    } catch (err) {
      console.warn('Dislike toggle failed:', err);
    } finally {
      setPendingReactions((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!currentUserId) return;
    try {
      await reviewService.deleteReview(reviewId, currentUserId);
      setLiveReviews((prev) => prev.filter((r) => r.id !== reviewId));
      const aggr = await reviewService.calculateShopRatings(shop.id);
      setAggregatedRatings(aggr);
    } catch (err) {
      console.warn('Delete review failed:', err);
    }
  };

  // Build list of real photos uploaded for this stall
  const stallPhotos: StallPhotoItem[] = [];

  // 1. Primary stall photo from shop registration
  if (shop.imageUrl && shop.imageUrl.trim() !== '') {
    stallPhotos.push({
      id: 'stall-hero',
      url: shop.imageUrl,
      caption: `${shop.name} Stall Front`,
      uploadedBy: shop.ownerId ? 'Shopkeeper' : 'FoodCheck',
      uploadedRole: 'Shopkeeper'
    });
  }

  // 2. Menu card photo from shop registration if uploaded
  if (shop.menuCardImage && shop.menuCardImage.trim() !== '') {
    stallPhotos.push({
      id: 'stall-menu',
      url: shop.menuCardImage,
      caption: 'Official Menu Card',
      uploadedBy: 'Shopkeeper',
      uploadedRole: 'Shopkeeper'
    });
  }

  // 3. Real photos uploaded by users in their reviews/experiences
  liveReviews.forEach((rev) => {
    if (rev.photoUrl && rev.photoUrl.trim() !== '') {
      stallPhotos.push({
        id: `rev-photo-${rev.id}`,
        url: rev.photoUrl,
        caption: rev.reviewText || 'Food photo',
        uploadedBy: rev.userName,
        uploadedRole: rev.userId === shop.ownerId ? 'Shopkeeper' : 'Customer',
        date: rev.date
      });
    }
  });

  // Handle file selection from camera or gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setPhotoPreviewUrl(preview);
      setShowUploadModal(true);
    }
  };

  // Upload Stall Photo (by shopkeeper or normal user)
  const handleUploadPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhotoFile) return;

    setIsUploadingPhoto(true);
    try {
      const uploaderId = currentUserId || 'guest-' + Date.now();
      const uploadedUrl = await shopService.uploadShopMedia(selectedPhotoFile, uploaderId, 'stall');

      // Create a real review/experience entry in Firestore with this photo
      await reviewService.createReview({
        userId: uploaderId,
        userName: currentUserId === shop.ownerId ? `${shop.name} (Shopkeeper)` : 'Community Foodie',
        userProfileImage: '',
        targetId: shop.id,
        targetType: 'shop',
        rating: 5,
        reviewText: photoCaption.trim() || 'Stall photo uploaded by community foodie.',
        photoUrl: uploadedUrl
      });

      // Reload real reviews to display updated photos
      await loadReviews();

      // Clean up modal state
      setSelectedPhotoFile(null);
      setPhotoPreviewUrl(null);
      setPhotoCaption('');
      setShowUploadModal(false);
    } catch (err: any) {
      console.warn('Failed to upload stall photo:', err);
      alert(err.message || 'Failed to upload stall photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FAF7F2] text-slate-900 overflow-y-auto select-none pb-12">
      {/* Hero Image with Floating Controls */}
      <div className="relative h-56 w-full bg-slate-900 flex-shrink-0">
        {shop.imageUrl ? (
          <img
            src={shop.imageUrl}
            alt={shop.name}
            className="w-full h-full object-cover opacity-90"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-900 via-orange-950 to-slate-900 text-amber-200/80">
            <Store size={44} />
            <span className="text-xs font-semibold mt-2">No stall photo uploaded yet</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60 pointer-events-none"></div>

        {/* Top bar controls */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: shop.name, url: window.location.href }).catch(() => {});
                }
              }}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
              aria-label="Share"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Shop Name & Status on Hero */}
        <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full backdrop-blur-md ${
                shop.isOpen ? 'bg-amber-500/90 text-slate-950' : 'bg-slate-600/90 text-slate-200'
              }`}
            >
              {shop.isOpen ? '🟢 Open Now' : 'Closed'}
            </span>
            <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
              <ShieldCheck size={13} />
              <span>FoodCheck Verified Stall</span>
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight leading-snug">
            {shop.name}
          </h2>
          <p className="text-xs text-slate-200 font-medium">
            {shop.category}
          </p>
        </div>
      </div>

      {/* STRICTLY 2 TABS: TAB 1: Ratings & Experiences, TAB 2: Photos */}
      <div className="bg-white border-b border-slate-200/80 px-4 flex items-center justify-around sticky top-0 z-30 shadow-2xs">
        <button
          onClick={() => setActiveTab('ratings')}
          className={`flex-1 py-3.5 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ratings'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ratings & Experiences ({aggregatedRatings.reviewsCount})
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex-1 py-3.5 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'photos'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Photos ({stallPhotos.length})
        </button>
      </div>

      {/* TAB 1: RATINGS & EXPERIENCES */}
      {activeTab === 'ratings' && (
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Real Rating & Quick Info Header */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-black text-slate-900">
                  {aggregatedRatings.reviewsCount > 0 ? aggregatedRatings.rating : '—'}
                </div>
                <div>
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          aggregatedRatings.reviewsCount > 0 && i < Math.floor(aggregatedRatings.rating)
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-slate-300'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {aggregatedRatings.reviewsCount > 0
                      ? `Based on ${aggregatedRatings.reviewsCount} verified reviews`
                      : 'No reviews yet'}
                  </span>
                </div>
              </div>

              {shop.distance && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold">
                  <MapPin size={13} />
                  <span>{shop.distance}</span>
                </div>
              )}
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                <span>{shop.openingTime} - {shop.closingTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Utensils size={14} className="text-slate-400" />
                <span className="truncate">{shop.category}</span>
              </div>
            </div>
          </div>

          {/* Breakdown: Overall Food Quality & Hygiene Ratings from Firebase */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Food Quality Rating
              </span>
              <div className="flex items-center gap-1.5 mt-2">
                <Star
                  size={18}
                  className={aggregatedRatings.reviewsCount > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}
                />
                <span className="text-xl font-extrabold text-slate-900">
                  {aggregatedRatings.reviewsCount > 0 ? aggregatedRatings.foodQualityRating : '—'}
                </span>
                {aggregatedRatings.reviewsCount > 0 && <span className="text-xs text-slate-400">/ 5</span>}
              </div>
              <span className="text-[10px] text-orange-600 font-semibold mt-1">
                {aggregatedRatings.reviewsCount > 0 ? 'Taste & Quality' : 'No ratings yet'}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hygiene Rating
              </span>
              <div className="flex items-center gap-1.5 mt-2">
                <ShieldCheck
                  size={18}
                  className={aggregatedRatings.reviewsCount > 0 ? 'text-orange-500' : 'text-slate-300'}
                />
                <span className="text-xl font-extrabold text-slate-900">
                  {aggregatedRatings.reviewsCount > 0 ? aggregatedRatings.hygieneRating : '—'}
                </span>
                {aggregatedRatings.reviewsCount > 0 && <span className="text-xs text-slate-400">/ 5</span>}
              </div>
              <span className="text-[10px] text-orange-600 font-semibold mt-1">
                {aggregatedRatings.reviewsCount > 0 ? 'Cleanliness & Safety' : 'No ratings yet'}
              </span>
            </div>
          </div>

          {/* Customer Reviews & Experiences Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Community Reviews & Experiences
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Real feedback on freshness, hygiene & taste
                </p>
              </div>
              <button
                onClick={() => onWriteReview(shop.id)}
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
              >
                <MessageSquareHeart size={13} />
                <span>Write Review</span>
              </button>
            </div>

            <div className="space-y-3">
              {loadingReviews ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 size={20} className="animate-spin text-orange-500" />
                  <span className="text-xs">Loading reviews…</span>
                </div>
              ) : liveReviews.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  No reviews yet. Be the first to share your rating & experience!
                </div>
              ) : (
                liveReviews.map((rev) => {
                  const isCurrentUserReview = Boolean(currentUserId && rev.userId === currentUserId);
                  const isPendingLike = pendingReactions[rev.id] === 'like';
                  const isPendingDislike = pendingReactions[rev.id] === 'dislike';
                  const isBusy = Boolean(pendingReactions[rev.id]);

                  return (
                    <div
                      key={rev.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrentUserReview
                          ? 'bg-amber-50/50 border-amber-300/80 ring-1 ring-amber-200'
                          : 'bg-slate-50 border-slate-200/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {/* Interactive Reviewer Identity -> Opens User Profile */}
                        <div
                          onClick={() => {
                            if (rev.userId && onOpenUserProfile) {
                              onOpenUserProfile(rev.userId);
                            }
                          }}
                          className="flex items-center gap-2 cursor-pointer group active:opacity-75 transition-opacity"
                          title={isCurrentUserReview ? 'View your profile' : `View ${rev.userName}'s profile`}
                        >
                          <img
                            src={rev.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={rev.userName}
                            className="w-8 h-8 rounded-full object-cover bg-slate-200 ring-1 ring-slate-200 group-hover:ring-2 group-hover:ring-orange-400 transition-all"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                                {rev.userName}
                              </h4>
                              {isCurrentUserReview && (
                                <span className="bg-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shadow-2xs">
                                  Your Review
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">{rev.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Rating stars */}
                          <div className="flex items-center text-amber-500">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} size={12} className="fill-amber-500" />
                            ))}
                          </div>

                          {/* Delete button for review owner */}
                          {isCurrentUserReview && (
                            <button
                              onClick={() => handleDelete(rev.id)}
                              title="Delete your review"
                              className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Review Text / Experience */}
                      <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                        “{rev.reviewText}”
                      </p>

                      {/* Attached Review Photo if any */}
                      {rev.photoUrl && (
                        <div className="mt-2.5">
                          <img
                            src={rev.photoUrl}
                            alt="Review attachment"
                            onClick={() =>
                              setActiveLightboxPhoto({
                                id: rev.id,
                                url: rev.photoUrl!,
                                caption: rev.reviewText,
                                uploadedBy: rev.userName,
                                uploadedRole: isCurrentUserReview ? 'Customer' : 'Customer'
                              })
                            }
                            className="w-28 h-20 rounded-xl object-cover ring-1 ring-slate-200 hover:opacity-90 transition-opacity cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Likes and reaction row */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/60">
                        <div className="flex items-center gap-2">
                          {/* Like button - comfortable mobile touch target */}
                          <button
                            type="button"
                            onClick={() => handleLike(rev.id)}
                            disabled={isBusy}
                            className={`flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed ${
                              isPendingLike
                                ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-400 scale-95'
                                : rev.userLiked
                                ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-2xs'
                                : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 border border-transparent'
                            }`}
                            title="Helpful (Like)"
                          >
                            <ThumbsUp
                              size={16}
                              className={`transition-transform ${
                                rev.userLiked || isPendingLike ? 'fill-orange-500 text-orange-500 scale-110' : 'text-slate-500'
                              }`}
                            />
                            <span>{rev.likeCount}</span>
                            {isPendingLike && <Loader2 size={12} className="animate-spin text-orange-600 ml-0.5" />}
                          </button>

                          {/* Dislike button - comfortable mobile touch target */}
                          <button
                            type="button"
                            onClick={() => handleDislike(rev.id)}
                            disabled={isBusy}
                            className={`flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed ${
                              isPendingDislike
                                ? 'bg-slate-200 text-slate-900 ring-2 ring-slate-400 scale-95'
                                : rev.userDisliked
                                ? 'bg-slate-200/80 text-slate-800 border border-slate-300 shadow-2xs'
                                : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-500 border border-transparent'
                            }`}
                            title="Not helpful (Dislike)"
                          >
                            <ThumbsDown
                              size={16}
                              className={`transition-transform ${
                                rev.userDisliked || isPendingDislike ? 'fill-slate-700 text-slate-700 scale-110' : 'text-slate-400'
                              }`}
                            />
                            {(rev.dislikeCount || 0) > 0 && <span>{rev.dislikeCount}</span>}
                            {isPendingDislike && <Loader2 size={12} className="animate-spin text-slate-600 ml-0.5" />}
                          </button>
                        </div>

                        <span className="text-[10px] text-amber-950 font-semibold bg-amber-100 px-2 py-1 rounded-md">
                          Verified Experience
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHOTOS */}
      {activeTab === 'photos' && (
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Header & Add Photo CTA */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Stall Photos ({stallPhotos.length})
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Uploaded by shopkeeper & FoodCheck community
              </p>
            </div>

            {/* Upload Stall Photo Button */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer shadow-xs"
              >
                <Camera size={14} />
                <span>+ Add Photo</span>
              </button>
            </div>
          </div>

          {/* Photos Grid */}
          {stallPhotos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center">
              <ImageIcon size={36} className="mx-auto mb-2 text-slate-300" />
              <h4 className="text-xs font-bold text-slate-700 mb-1">No photos uploaded yet</h4>
              <p className="text-[11px] text-slate-400 mb-4">
                Be the first to upload a photo of this stall or its food!
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
              >
                <Camera size={14} />
                <span>Upload First Photo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {stallPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setActiveLightboxPhoto(photo)}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs group cursor-pointer active:scale-98 transition-transform"
                >
                  <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Stall photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 size={12} />
                    </div>
                    {photo.uploadedRole && (
                      <span className="absolute bottom-2 left-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white">
                        {photo.uploadedRole}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] font-bold text-slate-800 truncate">
                      {photo.caption || 'Stall Photo'}
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 mt-0.5">
                      <span className="truncate">by {photo.uploadedBy || 'FoodCheck'}</span>
                      {photo.date && <span>{photo.date}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Photo Confirmation Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-orange-500" />
                <h3 className="text-xs font-bold text-slate-900">Upload Stall Photo</h3>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedPhotoFile(null);
                  setPhotoPreviewUrl(null);
                }}
                disabled={isUploadingPhoto}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {photoPreviewUrl && (
              <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={photoPreviewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Photo Caption (Optional)
              </label>
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="e.g. Delicious fresh butter dosa, stall cleanliness"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedPhotoFile(null);
                  setPhotoPreviewUrl(null);
                }}
                disabled={isUploadingPhoto}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadPhotoSubmit}
                disabled={isUploadingPhoto}
                className="flex-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Uploading…</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Add Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activeLightboxPhoto && (
        <div
          onClick={() => setActiveLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
        >
          <button
            onClick={() => setActiveLightboxPhoto(null)}
            className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full border border-white/20 cursor-pointer"
          >
            <X size={20} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full flex flex-col items-center"
          >
            <img
              src={activeLightboxPhoto.url}
              alt={activeLightboxPhoto.caption || 'Stall Photo'}
              className="max-h-[70vh] w-auto rounded-2xl object-contain shadow-2xl border border-white/10"
            />
            <div className="w-full mt-3 text-white text-center">
              <h4 className="text-sm font-bold">{activeLightboxPhoto.caption}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Uploaded by {activeLightboxPhoto.uploadedBy}{' '}
                {activeLightboxPhoto.uploadedRole ? `(${activeLightboxPhoto.uploadedRole})` : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
