import React from 'react';
import { ArrowLeft, Check, Globe } from 'lucide-react';
import { SupportedLanguage } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../utils/translations';

interface LanguageScreenProps {
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onBack: () => void;
}

export const LanguageScreen: React.FC<LanguageScreenProps> = ({
  currentLanguage,
  onSelectLanguage,
  onBack,
}) => {
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
          Select Language / भाषा निवडा
        </h2>
        <div className="w-9"></div>
      </div>

      <div className="p-4 space-y-3 pb-12">
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5">
          <Globe size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-orange-950 font-medium leading-relaxed">
            FoodCheck supports 8 official Indian languages. Choose your preferred language for safety alerts, scanner labels, and community recommendations.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLanguage === lang.code;

            return (
              <button
                key={lang.code}
                onClick={() => onSelectLanguage(lang.code)}
                className={`w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left ${
                  isSelected ? 'bg-amber-50/60' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">
                    {lang.nativeName}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {lang.name}
                  </span>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center">
                    <Check size={14} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-slate-300"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
