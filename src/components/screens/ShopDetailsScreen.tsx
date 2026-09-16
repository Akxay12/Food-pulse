import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, Clock, Utensils, ThumbsUp, ThumbsDown, MessageSquareHeart, Share2, ShieldCheck, Check, Trash2, Loader2, Sparkles } from 'lucide-react';
import { FoodShop, ShopReview } from '../../types';
import { reviewService } from '../../services/reviewService';

interface ShopDetailsScreenProps {
  shop: FoodShop;
  currentUserId?: string;
  onBack: () => void;
  onWriteReview: (shopId: string) => void;
  onToggleLikeReview?: (shopId: string, reviewId: string) => void;
}

export const ShopDetailsScreen: React.FC<ShopDetailsScreenProps> = ({
  shop,
  currentUserId,
  onBack,
  onWriteReview,
  onToggleLikeReview
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'reviews'>('overview');
  const [liveReviews, setLiveReviews] = useState<ShopReview[]>(shop.reviews || []);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [aggregatedRatings, setAggregatedRatings] = useState({
    rating: shop.rating || 4.5,
    foodQualityRating: shop.foodQualityRating || 4.6,
    hygieneRating: shop.hygieneRating || 4.5,
    reviewsCount: shop.reviews?.length || 0
  });

  // Load reviews from Firestore
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
            userName: f.userName,
            userAvatar: f.userProfileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            rating: f.rating,
            subRatings: f.subRatings,
            reviewText: f.reviewText,
            likeCount: f.likesCount,
            dislikeCount: f.dislikesCount || 0,
            date: new Date(f.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            userLiked: f.userReaction === 'like',
            userDisliked: f.userReaction === 'dislike'
          }))
        );

        // Compute live aggregate ratings
        const aggr = await reviewService.calculateShopRatings(shop.id);
        setAggregatedRatings(aggr);
      } else {
        setLiveReviews(shop.reviews || []);
      }
    } catch {
      setLiveReviews(shop.reviews || []);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [shop.id, currentUserId]);

  const handleLike = async (reviewId: string) => {
    if (onToggleLikeReview) {
      onToggleLikeReview(shop.id, reviewId);
    }
    if (!currentUserId) return;

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
    } catch (err) {
      console.warn('Like toggle failed:', err);
    }
  };

  const handleDislike = async (reviewId: string) => {
    if (!currentUserId) return;

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
    } catch (err) {
      console.warn('Dislike toggle failed:', err);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!currentUserId) return;
    if (!window.confirm('Delete your review?')) return;

    try {
      await reviewService.deleteReview(reviewId, currentUserId);
      setLiveReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err: any) {
      alert(err.message || 'Could not delete review');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F2] text-slate-900 overflow-y-auto select-none pb-8">
      {/* Hero Image with Floating Controls */}
      <div className="relative h-56 w-full bg-slate-900 flex-shrink-0">
        <img
          src={shop.imageUrl}
          alt={shop.name}
          className="w-full h-full object-cover opacity-90"
        />
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
              <span>FoodCheck Verified</span>
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

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Overview & Ratings
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'menu'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Menu Card ({shop.menuItems.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'reviews'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Reviews ({liveReviews.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-4">
        {/* Rating & Quick Info Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-black text-slate-900">
                {aggregatedRatings.rating}
              </div>
              <div>
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.floor(aggregatedRatings.rating) ? 'fill-amber-500' : 'text-slate-300'}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {aggregatedRatings.reviewsCount > 0
                    ? `Based on ${aggregatedRatings.reviewsCount} community ratings`
                    : 'Community FoodCheck rating'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold">
              <MapPin size={13} />
              <span>{shop.distance}</span>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-slate-400" />
              <span>{shop.openingTime} - {shop.closingTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Utensils size={14} className="text-slate-400" />
              <span className="truncate">{shop.category.split('&')[0]}</span>
            </div>
          </div>
        </div>

        {/* Breakdown Sections: Overall Food Quality & Hygiene */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Overall Food Rating
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <Star size={18} className="text-amber-500 fill-amber-500" />
              <span className="text-xl font-extrabold text-slate-900">
                {aggregatedRatings.foodQualityRating}
              </span>
              <span className="text-xs text-slate-400">/ 5</span>
            </div>
            <span className="text-[10px] text-orange-600 font-semibold mt-1">
              Taste, Freshness & Quality
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hygiene Rating
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <ShieldCheck size={18} className="text-orange-500" />
              <span className="text-xl font-extrabold text-slate-900">
                {aggregatedRatings.hygieneRating}
              </span>
              <span className="text-xs text-slate-400">/ 5</span>
            </div>
            <span className="text-[10px] text-orange-600 font-semibold mt-1">
              Cleanliness & Safe Service
            </span>
          </div>
        </div>

        {/* Menu Section: "Menu Card" */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Menu Card & Pricing
            </h3>
            <span className="text-[11px] font-semibold text-orange-600">
              Daily Fresh
            </span>
          </div>

          {/* Menu Items List */}
          <div className="divide-y divide-slate-100">
            {shop.menuItems.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm border border-green-600 flex items-center justify-center p-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">{item.category}</span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-900">
                  {item.price}
                </span>
              </div>
            ))}
          </div>

          {shop.menuCardImage && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
                Official Stall Photo:
              </span>
              <img
                src={shop.menuCardImage}
                alt="Menu Card"
                className="w-full h-32 rounded-xl object-cover ring-1 ring-slate-200"
              />
            </div>
          )}
        </div>

        {/* Customer Reviews Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Community Reviews
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Verified ratings on food freshness & hygiene
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
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No reviews yet. Be the first to review this shop.
              </p>
            ) : (
              liveReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={rev.userAvatar}
                        alt={rev.userName}
                        className="w-7 h-7 rounded-full object-cover bg-slate-200 ring-1 ring-slate-200"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {rev.userName}
                        </h4>
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

                      {/* Delete button for review owner (Module 1L) */}
                      {currentUserId && rev.userId === currentUserId && (
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

                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                    “{rev.reviewText}”
                  </p>

                  {/* Likes and interaction buttons */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-3">
                      {/* Like button */}
                      <button
                        onClick={() => handleLike(rev.id)}
                        className={`flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${
                          rev.userLiked ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Helpful (Like)"
                      >
                        <ThumbsUp size={13} className={rev.userLiked ? 'fill-orange-500 text-orange-500' : ''} />
                        <span>{rev.likeCount}</span>
                      </button>

                      {/* Dislike button */}
                      <button
                        onClick={() => handleDislike(rev.id)}
                        className={`flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${
                          rev.userDisliked ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Not helpful (Dislike)"
                      >
                        <ThumbsDown size={13} className={rev.userDisliked ? 'fill-slate-700 text-slate-700' : ''} />
                        {(rev.dislikeCount || 0) > 0 && <span>{rev.dislikeCount}</span>}
                      </button>
                    </div>

                    <span className="text-[10px] text-amber-950 font-semibold bg-amber-100 px-2 py-0.5 rounded-md">
                      Helpful Review
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
