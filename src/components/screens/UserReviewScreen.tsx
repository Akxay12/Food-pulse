import React, { useState } from 'react';
import { ArrowLeft, Star, Camera, Upload, CheckCircle2, Store, UtensilsCrossed } from 'lucide-react';
import { FoodShop, ShopReview } from '../../types';

interface UserReviewScreenProps {
  shops: FoodShop[];
  initialShopId?: string;
  onBack: () => void;
  onSubmitReview: (review: {
    targetType: 'food' | 'shop';
    shopId: string;
    rating: number;
    subRatings: Record<string, number>;
    reviewText: string;
    photoUrl?: string;
  }) => void;
}

export const UserReviewScreen: React.FC<UserReviewScreenProps> = ({
  shops,
  initialShopId,
  onBack,
  onSubmitReview,
}) => {
  const [targetType, setTargetType] = useState<'shop' | 'food'>('shop');
  const [selectedShopId, setSelectedShopId] = useState<string>(initialShopId || shops[0]?.id || '');
  const [overallRating, setOverallRating] = useState<number>(5);

  // Sub-ratings:
  // For shop: Hygiene, Cleanliness, Service
  // For food: Taste, Freshness, Quality
  const [subRatings, setSubRatings] = useState<Record<string, number>>({
    sub1: 5,
    sub2: 4,
    sub3: 5,
  });

  const [reviewText, setReviewText] = useState(
    'Food was fresh and the stall was clean. The server wore caps and handled food with care!'
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&auto=format&fit=crop&q=80'
  );

  const subLabels =
    targetType === 'shop'
      ? [
          { key: 'sub1', label: 'Hygiene' },
          { key: 'sub2', label: 'Cleanliness' },
          { key: 'sub3', label: 'Service' },
        ]
      : [
          { key: 'sub1', label: 'Taste' },
          { key: 'sub2', label: 'Freshness' },
          { key: 'sub3', label: 'Quality' },
        ];

  const handleSubRatingChange = (key: string, value: number) => {
    setSubRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReview({
      targetType,
      shopId: selectedShopId,
      rating: overallRating,
      subRatings,
      reviewText,
      photoUrl: photoPreview || undefined,
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F2] text-slate-900 overflow-y-auto select-none">
      {/* Top Bar */}
      <div className="bg-white px-4 py-3.5 border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Share Your Experience
        </h2>
        <div className="w-9"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-12">
        {/* Toggle: Review Food vs Review Shop */}
        <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center border border-slate-300/40">
          <button
            type="button"
            onClick={() => setTargetType('shop')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              targetType === 'shop'
                ? 'bg-white text-orange-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store size={14} />
            <span>Shop Experience</span>
          </button>
          <button
            type="button"
            onClick={() => setTargetType('food')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              targetType === 'food'
                ? 'bg-white text-orange-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UtensilsCrossed size={14} />
            <span>Food Item</span>
          </button>
        </div>

        {/* Shop Selector */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Select Stall / Shop
          </label>
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-orange-500"
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.category})
              </option>
            ))}
          </select>
        </div>

        {/* Overall Star Rating */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-center shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Overall Rating
          </span>
          <div className="flex items-center justify-center gap-2 mt-3 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setOverallRating(star)}
                className="p-1 text-amber-500 active:scale-125 transition-transform"
              >
                <Star
                  size={32}
                  className={star <= overallRating ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}
                />
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-700 mt-2">
            {overallRating === 5
              ? 'Excellent & Fresh'
              : overallRating === 4
              ? 'Very Good'
              : overallRating === 3
              ? 'Average'
              : 'Needs Improvement'}
          </p>
        </div>

        {/* Sub-Ratings Grid (Hygiene, Cleanliness, Service OR Taste, Freshness, Quality) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            {targetType === 'shop' ? 'Shop Evaluation Metrics' : 'Food Evaluation Metrics'}
          </span>

          {subLabels.map((sub) => (
            <div key={sub.key} className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-700">{sub.label}</span>
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleSubRatingChange(sub.key, st)}
                    className="p-0.5 text-amber-500 hover:scale-110"
                  >
                    <Star
                      size={17}
                      className={st <= subRatings[sub.key] ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Text Review */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Write your review...
          </label>
          <textarea
            rows={3}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share details on freshness, hygiene, cleanliness, taste, and oil quality..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-orange-500 leading-relaxed"
            required
          />
        </div>

        {/* Optional Add Food Photo */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Add Food Photo (Optional)
          </label>

          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden h-28 w-full border border-slate-200">
              <img src={photoPreview} alt="Review attachment" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                setPhotoPreview(
                  'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&auto=format&fit=crop&q=80'
                )
              }
              className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:border-orange-500 hover:text-orange-700 transition-colors"
            >
              <Camera size={18} />
              <span className="text-xs font-semibold">Attach Food / Stall Photo</span>
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <CheckCircle2 size={18} />
          <span>Post Review</span>
        </button>
      </form>
    </div>
  );
};
