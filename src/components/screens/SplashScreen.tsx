import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import foodPulseLogo from '../../assets/logo.png';

interface SplashScreenProps {
  onFinish: () => void;
  taglineText?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  taglineText = 'Check it. Know it. Eat smarter.'
}) => {
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Staged entry animation: Logo first, then app name & tagline
    const t1 = setTimeout(() => setShowLogo(true), 250);
    const t2 = setTimeout(() => setShowText(true), 750);
    const t3 = setTimeout(() => setShowButton(true), 1300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-8 bg-gradient-to-b from-[#FFFDF7] via-[#FFF9EE] to-[#FFF3DC] text-center select-none">
      {/* Top subtle badge */}
      <div className="pt-6">
        <span className="text-[11px] uppercase tracking-widest text-amber-900/90 font-bold bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300/50">
          AI Food Safety & Discovery
        </span>
      </div>

      {/* Center Logo & Branding */}
      <div className="flex flex-col items-center justify-center my-auto">
        {/* Animated Logo Shield */}
        <div
          className={`transition-all duration-700 transform ${
            showLogo ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-4'
          }`}
        >
          <div className="w-28 h-28 rounded-3xl overflow-hidden bg-white shadow-xl shadow-orange-500/20 flex items-center justify-center border border-amber-200/60 p-2">
            <img src={foodPulseLogo} alt="FoodCheck Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Animated App Name & Tagline */}
        <div
          className={`mt-6 transition-all duration-700 transform ${
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Food<span className="text-orange-500">Check</span>
          </h1>
          <p className="text-sm font-medium text-slate-600 mt-2 max-w-xs leading-relaxed">
            “{taglineText}”
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className={`w-full max-w-xs pb-6 transition-all duration-500 ${
          showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <button
          onClick={onFinish}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-semibold shadow-md shadow-orange-500/25 transition-all"
        >
          <span>Get Started</span>
          <ArrowRight size={18} />
        </button>
        <p className="text-[11px] text-slate-400 font-medium mt-3">
          Trusted AI scanning for packaged & street food
        </p>
      </div>
    </div>
  );
};
