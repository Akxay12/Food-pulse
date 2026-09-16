import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Share2, BookmarkCheck, Camera, ShieldAlert, Sparkles, Info } from 'lucide-react';
import { FoodScanResult } from '../../types';

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
  const isGreen = score >= 7.5;
  const isYellow = score >= 6.0 && score < 7.5;
  const isRed = score < 6.0;

  const scoreTheme = isGreen
    ? {
        border: 'border-amber-500',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        labelBg: 'bg-amber-100 text-amber-950 border-amber-300',
        circleStroke: '#F59E0B',
        label: t.lowerRisk || 'Lower apparent risk'
      }
    : isYellow
    ? {
        border: 'border-orange-500',
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        labelBg: 'bg-orange-100 text-orange-950 border-orange-300',
        circleStroke: '#F97316',
        label: t.cautionRisk || 'Caution'
      }
    : {
        border: 'border-red-500',
        bg: 'bg-red-50',
        text: 'text-red-700',
        labelBg: 'bg-red-100 text-red-900 border-red-300',
        circleStroke: '#EF4444',
        label: t.higherRisk || 'Higher apparent risk'
      };

  const handleSave = () => {
    setIsSaved(true);
    onSaveResult(scanResult);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F2] text-slate-900 overflow-y-auto">
      {/* Top Navigation Bar */}
      <div className="bg-white px-4 py-3.5 border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          {t.safetyScoreTitle || 'AI Food Safety Assessment'}
        </h2>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `FoodCheck: ${scanResult.foodName}`,
                text: `Safety score: ${scanResult.safetyScore}/10 (${scanResult.riskLabel}) on FoodCheck AI!`,
                url: window.location.href
              }).catch(() => {});
            } else {
              setShowToast(true);
              setTimeout(() => setShowToast(false), 2000);
            }
          }}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
          aria-label="Share"
        >
          <Share2 size={17} />
        </button>
      </div>

      <div className="p-4 space-y-4 pb-12">
        {/* Scanned Food Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center gap-3.5 shadow-xs">
          <img
            src={scanResult.imageUrl}
            alt={scanResult.foodName}
            className="w-16 h-16 rounded-xl object-cover bg-slate-100 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
                {scanResult.foodType === 'packaged' ? 'Packaged' : 'Street Food'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">· {scanResult.scanDate}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 truncate">
              {scanResult.foodName}
            </h3>
            <p className="text-[11px] text-slate-500 truncate">
              Analyzed via FoodCheck Vision AI
            </p>
          </div>
        </div>

        {/* Large Circular Safety Score Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col items-center text-center shadow-xs">
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
                /10
              </span>
            </div>
          </div>

          {/* Dynamic Risk Label */}
          <div className={`mt-4 px-3.5 py-1.5 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-2xs ${scoreTheme.labelBg}`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span>{scoreTheme.label}</span>
          </div>

          <p className="text-[11px] text-slate-400 font-medium mt-2">
            Safety Score calculated from 5 verified visual criteria
          </p>
        </div>

        {/* Analysis Summary Cards */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            {t.analysisSummary || 'Analysis Summary'}
          </h3>

          <div className="space-y-2">
            {scanResult.summaryItems.map((item) => {
              const isSafe = item.status === 'safe';
              const isItemCaution = item.status === 'caution';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-start gap-3 shadow-xs"
                >
                  <div
                    className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSafe
                        ? 'bg-amber-100 text-amber-800'
                        : isItemCaution
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isSafe ? (
                      <CheckCircle2 size={15} strokeWidth={2.5} />
                    ) : isItemCaution ? (
                      <AlertTriangle size={15} strokeWidth={2.5} />
                    ) : (
                      <XCircle size={15} strokeWidth={2.5} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">
                        {item.title}
                      </h4>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isSafe
                            ? 'bg-amber-50 text-amber-800'
                            : isItemCaution
                            ? 'bg-orange-50 text-orange-800'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {isSafe ? 'Valid / Normal' : isItemCaution ? 'Review Recommended' : 'Attention'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs mb-1.5">
            <Sparkles size={15} className="text-amber-600" />
            <span>{t.aiRecommendation || 'AI Recommendation'}</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {scanResult.recommendation}
          </p>
        </div>

        {/* Small Mandatory Disclaimer Banner */}
        <div className="p-3 bg-slate-100 rounded-xl border border-slate-200/70 flex items-start gap-2 text-slate-500">
          <Info size={14} className="flex-shrink-0 mt-0.5 text-slate-400" />
          <p className="text-[10px] leading-relaxed font-medium">
            {scanResult.disclaimer || t.disclaimer}
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
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
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
