import React from 'react';
import { ShieldCheck, Utensils } from 'lucide-react';

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
    sm: { box: 'w-8 h-8 rounded-xl', icon: 16, shield: 14, title: 'text-base font-bold', tagline: 'text-[10px]' },
    md: { box: 'w-11 h-11 rounded-2xl', icon: 20, shield: 18, title: 'text-xl font-extrabold', tagline: 'text-xs' },
    lg: { box: 'w-16 h-16 rounded-3xl', icon: 28, shield: 24, title: 'text-2xl font-extrabold', tagline: 'text-sm' },
    xl: { box: 'w-24 h-24 rounded-[32px]', icon: 42, shield: 36, title: 'text-3xl font-black', tagline: 'text-base' },
  };

  const current = sizeMap[size];

  return (
    <div className="flex items-center gap-3">
      {/* Food + Shield Checkmark icon symbol */}
      <div className={`relative ${current.box} bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/20 text-white flex-shrink-0`}>
        {/* Shield background layer */}
        <ShieldCheck className="text-white/95" size={current.icon} strokeWidth={2.4} />
        {/* Subtle nested fork/leaf symbol */}
        <div className="absolute -bottom-1 -right-1 bg-amber-300 text-slate-900 rounded-full p-1 border-2 border-white shadow-xs">
          <Utensils size={current.shield / 2.2} strokeWidth={2.8} />
        </div>
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
