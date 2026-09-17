import React from 'react';
import foodPulseLogo from '../../assets/logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  theme?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  theme = 'light'
}) => {
  const sizeMap = {
    sm: { box: 'w-8 h-8 rounded-xl', title: 'text-base font-bold', tagline: 'text-[10px]' },
    md: { box: 'w-11 h-11 rounded-2xl', title: 'text-xl font-extrabold', tagline: 'text-xs' },
    lg: { box: 'w-16 h-16 rounded-3xl', title: 'text-2xl font-extrabold', tagline: 'text-sm' },
    xl: { box: 'w-24 h-24 rounded-[32px]', title: 'text-3xl font-black', tagline: 'text-base' },
  };
  const current = sizeMap[size];
  return (
    <div className="flex items-center gap-3">
      <div className={`overflow-hidden ${current.box} bg-white flex items-center justify-center shadow-xs border border-slate-200/70 flex-shrink-0 p-0.5`}>
        <img src={foodPulseLogo} alt="FoodCheck Logo" className="w-full h-full object-contain" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className={`${current.title} tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Food<span className="text-orange-500">Check</span>
            </span>
          </div>
          {showTagline && (
            <span className={`${current.tagline} text-slate-500 font-medium tracking-tight mt-0.5`}>
              Check it. Know it. Eat smarter.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Logo Component / Placeholder ─────────────────────────────────────────────
interface LogoPlaceholderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
export const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({
  size = 'md',
  className = '',
}) => {
  const sMap: Record<string, string> = {
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-12 h-12 rounded-2xl',
    lg: 'w-16 h-16 rounded-3xl',
    xl: 'w-24 h-24 rounded-[28px]',
  };
  return (
    <div
      className={`${sMap[size]} overflow-hidden flex items-center justify-center bg-white shadow-xs border border-slate-200/70 flex-shrink-0 ${className}`}
      title="FoodPulse Brand Logo"
    >
      <img
        src={foodPulseLogo}
        alt="FoodPulse Logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
};
