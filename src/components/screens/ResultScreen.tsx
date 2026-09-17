import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Share2,
  BookmarkCheck,
  Camera,
  Sparkles,
  Info,
  Calendar,
  AlertCircle,
  Check,
  Percent
} from 'lucide-react';
import { FoodScanResult } from '../../types';
import { LogoPlaceholder } from '../common/Logo';

interface ResultScreenProps {
  scanResult: FoodScanResult;
  onBack: () => void;
  onScanAnother: () => void;
  onSaveResult: (result: FoodScanResult) => void;
  t: Record<string, string>;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  scanResult,
  onBack,
  onScanAnother,
  onSaveResult,
  t
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const score = scanResult.safetyScore;
  const confidencePercent = Math.round((scanResult.confidence || 0.85) * 100);

  const isGreen = score >= 7.5;
  const isYellow = score >= 6.0 && score < 7.5;

  const scoreTheme = isGreen
    ? {
        border: 'border-amber-500',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        labelBg: 'bg-amber-100 text-amber-950 border-amber-300',
        circleStroke: '#F59E0B',
        label: t.lowerRisk || 'LOWER APPARENT RISK'
      }
    : isYellow
    ? {
        border: 'border-orange-500',
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        labelBg: 'bg-orange-100 text-orange-950 border-orange-300',
        circleStroke: '#F97316',
        label: t.cautionRisk || 'CAUTION ADVISED'
      }
    : {
        border: 'border-red-500',
        bg: 'bg-red-50',
        text: 'text-red-700',
        labelBg: 'bg-red-100 text-red-900 border-red-300',
        circleStroke: '#EF4444',
        label: t.higherRisk || 'HIGHER APPARENT RISK'
      };

  const handleSave = () => {
    setIsSaved(true);
    onSaveResult(scanResult);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F2] text-slate-900 overflow-y-auto select-none pb-12">
      {/* Top Navigation Bar */}
      <div className="bg-white px-4 py-3 border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          <LogoPlaceholder size="sm" className="shadow-none border-none" />
          <h2 className="text-xs font-black text-slate-900 tracking-tight uppercase">
            {t.safetyScoreTitle || 'Food Safety Assessment'}
          </h2>
        </div>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator
                .share({
                  title: `FoodCheck: ${scanResult.foodName}`,
                  text: `Safety score: ${scanResult.safetyScore.toFixed(1)}/10 (${scanResult.riskLabel}) on FoodCheck AI!`,
                  url: window.location.href
                })
                .catch(() => {});
            } else {
              setShowToast(true);
              setTimeout(() => setShowToast(false), 2000);
            }
          }}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform cursor-pointer"
          aria-label="Share"
        >
          <Share2 size={17} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Scanned Food Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-4">
          <img
            src={scanResult.imageUrl}
            alt={scanResult.foodName}
            className="w-20 h-20 rounded-2xl object-cover bg-slate-100 flex-shrink-0 ring-2 ring-amber-100 shadow-xs"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80">
                {scanResult.foodType === 'packaged' ? 'Packaged Food' : 'Street Food'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">· {scanResult.scanDate}</span>
            </div>

            {/* Detected Food in Bold */}
            <div className="mt-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Detected Food
              </span>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate">
                {scanResult.foodName}
              </h3>
            </div>

            {/* Food Type */}
            <div className="mt-0.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Food Type: </span>
              <span className="text-xs font-bold text-orange-600">
                {scanResult.foodTypeLabel || (scanResult.foodType === 'packaged' ? 'Packaged Item' : 'Street Dish')}
              </span>
            </div>
          </div>
        </div>

        {/* Safety Score & Confidence Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col items-center text-center shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Safety Score
          </span>

          {/* Circular Score Gauge */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke={scoreTheme.circleStroke}
                strokeWidth="10"
                strokeDasharray="301.59"
                strokeDashoffset={301.59 - (301.59 * (score / 10))}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-900 tracking-tight">
                {score.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400 -mt-0.5">
                / 10
              </span>
            </div>
          </div>

          {/* Dynamic Risk Label */}
          <div className={`mt-4 px-4 py-1.5 rounded-full text-xs font-black border flex items-center gap-2 shadow-2xs ${scoreTheme.labelBg}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
            <span>{scoreTheme.label}</span>
          </div>

          {/* Confidence Indicator */}
          <div className="mt-3 flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-[11px] font-bold text-slate-600">
            <Percent size={13} className="text-amber-500" />
            <span>Confidence: {confidencePercent}%</span>
          </div>

          <p className="text-[11px] text-slate-400 font-medium mt-2">
            Evidence-based score computed strictly from visible indicators
          </p>
        </div>

        {/* Why this score? */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4.5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Why this score?
            </h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-normal bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
            {scanResult.explanation || scanResult.recommendation}
          </p>
        </div>

        {/* Positive Indicators */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4.5 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Positive Indicators
            </h3>
          </div>

          {scanResult.positiveIndicators && scanResult.positiveIndicators.length > 0 ? (
            <div className="space-y-1.5">
              {scanResult.positiveIndicators.map((pos, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-green-50/50 border border-green-200/60 p-2.5 rounded-2xl text-xs text-green-950"
                >
                  <Check size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{pos}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl">
              No specific positive indicators recorded for this image.
            </p>
          )}
        </div>

        {/* Visible Concerns */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4.5 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Visible Concerns
            </h3>
          </div>

          {scanResult.visibleConcerns && scanResult.visibleConcerns.length > 0 ? (
            <div className="space-y-1.5">
              {scanResult.visibleConcerns.map((concern, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-orange-50/60 border border-orange-200 p-2.5 rounded-2xl text-xs text-orange-950"
                >
                  <AlertCircle size={14} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{concern}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50/50 border border-green-200/60 p-3 rounded-2xl text-xs text-green-800 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-600" />
              <span>No obvious visual defects or visible contamination indicators detected.</span>
            </div>
          )}
        </div>

        {/* Expiry Date Card (For Packaged Food) */}
        {scanResult.foodType === 'packaged' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  scanResult.expiryDetected
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Calendar size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Expiry / Best Before OCR
                </span>
                <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                  {scanResult.detectedExpiryDate ||
                    (scanResult.expiryDetected ? 'Best Before: Verified' : 'Expiry could not be verified from this image.')}
                </p>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  scanResult.expiryDetected
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {scanResult.expiryDetected ? '✓ Detected' : 'Unverified'}
              </span>
            </div>
          </div>
        )}

        {/* Allergens Notice (If Any) */}
        {scanResult.allergens && scanResult.allergens.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
              Detected Allergen Advisory
            </span>
            <div className="flex flex-wrap gap-1.5">
              {scanResult.allergens.map((allergen, i) => (
                <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mandatory Laboratory Disclaimer Banner */}
        <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200/80 flex items-start gap-2.5 text-slate-600">
          <Info size={16} className="flex-shrink-0 mt-0.5 text-slate-400" />
          <p className="text-[10px] leading-relaxed font-medium">
            AI visual analysis cannot detect hidden bacteria, toxins, pathogens, or other invisible contamination. For definitive food safety, laboratory testing is required.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={onScanAnother}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Camera size={18} />
            <span>{t.scanAnother || 'Scan Another Food'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              isSaved
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <BookmarkCheck size={16} className={isSaved ? 'text-amber-700' : 'text-slate-500'} />
            <span>{isSaved ? 'Saved to Your Scans' : t.saveResult || 'Save Result'}</span>
          </button>
        </div>
      </div>

      {/* Floating Save Toast */}
      {showToast && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={15} className="text-amber-400" />
          <span>Scan result saved to history!</span>
        </div>
      )}
    </div>
  );
};
