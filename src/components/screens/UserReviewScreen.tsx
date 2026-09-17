import React, { useState, useRef } from 'react';
import { ArrowLeft, Star, Camera, Upload, CheckCircle2, Store, UtensilsCrossed, Loader2, AlertCircle, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FoodShop, ShopReview } from '../../types';
import { shopService } from '../../services/shopService';

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
  }) => Promise<void> | void;
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
  const [shopSubRatings, setShopSubRatings] = useState<Record<string, number>>({
    Hygiene: 5,
    Cleanliness: 5,
    Service: 4,
  });

  const [foodSubRatings, setFoodSubRatings] = useState<Record<string, number>>({
    Taste: 5,
    Freshness: 5,
    Quality: 4,
  });

  const [reviewText, setReviewText] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSubRatings = targetType === 'shop' ? shopSubRatings : foodSubRatings;

  const handleSubRatingChange = (key: string, value: number) => {
    if (targetType === 'shop') {
      setShopSubRatings((prev) => ({ ...prev, [key]: value }));
    } else {
      setFoodSubRatings((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoDataUrl(null);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleTriggerPhotoPick = async () => {
    setErrorMessage(null);
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await CapCamera.checkPermissions();
        if (perm.camera !== 'granted' || perm.photos !== 'granted') {
          const req = await CapCamera.requestPermissions({ permissions: ['camera', 'photos'] });
          if (req.camera === 'denied' && req.photos === 'denied') {
            setErrorMessage('Please grant camera & photo permissions in device settings.');
            return;
          }
        }

        const photo = await CapCamera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt
        });

        if (photo?.dataUrl) {
          setPhotoDataUrl(photo.dataUrl);
          setPhotoPreview(photo.dataUrl);
          setPhotoFile(null);
        }
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('dismiss')) {
          return;
        }
        fileInputRef.current?.click();
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overallRating || overallRating < 1) {
      setErrorMessage('Please select a star rating.');
      return;
    }
    if (!reviewText.trim()) {
      setErrorMessage('Please write your review feedback.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      let finalPhotoUrl: string | undefined = undefined;
      const mediaToUpload = photoDataUrl || photoFile;
      if (mediaToUpload) {
        finalPhotoUrl = await shopService.uploadShopMedia(mediaToUpload, selectedShopId || 'user', 'stall');
      }

      await onSubmitReview({
        targetType,
        shopId: selectedShopId,
        rating: overallRating,
        subRatings: currentSubRatings,
        reviewText: reviewText.trim(),
        photoUrl: finalPhotoUrl,
      });
      setSuccessMessage('Review & experience posted successfully!');
      setTimeout(() => {
        onBack();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit review.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FAF7F2] text-slate-900 overflow-y-auto select-none">
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              targetType === 'shop'
                ? 'bg-white text-orange-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store size={14} />
            <span>Shop Hygiene</span>
          </button>
          <button
            type="button"
            onClick={() => setTargetType('food')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              targetType === 'food'
                ? 'bg-white text-orange-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UtensilsCrossed size={14} />
            <span>Food Quality</span>
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
                className="p-1 text-amber-500 active:scale-125 transition-transform cursor-pointer"
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
              ? 'Excellent & Fresh (5/5)'
              : overallRating === 4
              ? 'Very Good (4/5)'
              : overallRating === 3
              ? 'Average (3/5)'
              : 'Needs Improvement (<3/5)'}
          </p>
        </div>

        {/* Sub-Ratings Grid (Hygiene, Cleanliness, Service OR Taste, Freshness, Quality) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            {targetType === 'shop' ? 'Shop Hygiene Metrics' : 'Food Taste & Freshness Metrics'}
          </span>

          {Object.entries(currentSubRatings).map(([label, val]) => (
            <div key={label} className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-700">{label}</span>
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleSubRatingChange(label, st)}
                    className="p-0.5 text-amber-500 hover:scale-110 cursor-pointer"
                  >
                    <Star
                      size={17}
                      className={st <= Number(val) ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}
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
            Add Food / Stall Photo (Optional)
          </label>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden h-32 w-full border border-slate-200">
              <img src={photoPreview} alt="Review attachment" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoFile(null);
                }}
                className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 text-xs cursor-pointer hover:bg-black"
                title="Remove photo"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleTriggerPhotoPick}
              className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:border-orange-500 hover:text-orange-700 transition-colors cursor-pointer"
            >
              <Camera size={18} />
              <span className="text-xs font-semibold">Take or Select Real Photo</span>
            </button>
          )}
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Posting review…</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              <span>Post Review</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
