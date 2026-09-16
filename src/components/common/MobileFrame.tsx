import React, { useState } from 'react';
import { Wifi, Signal, BatteryMedium, Smartphone, Maximize2, Minimize2 } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  activeScreen: string;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children, activeScreen }) => {
  const [isFrameMode, setIsFrameMode] = useState<boolean>(true);

  // Current realistic time
  const currentTime = '09:41';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 select-none">
      {/* Top Desktop Helper Toolbar */}
      <header className="hidden sm:flex items-center justify-between w-full max-w-md mb-3 px-2 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Android Mobile UI · Flutter Ready
          </span>
        </div>
        <button
          onClick={() => setIsFrameMode(!isFrameMode)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Toggle Mobile Bezel"
        >
          {isFrameMode ? (
            <>
              <Maximize2 size={13} />
              <span>Full View</span>
            </>
          ) : (
            <>
              <Minimize2 size={13} />
              <span>Device Bezel</span>
            </>
          )}
        </button>
      </header>

      {/* Android Device Mockup Container */}
      <div
        className={`w-full transition-all duration-300 bg-[#FAF7F2] text-slate-900 overflow-hidden relative shadow-2xl ${
          isFrameMode
            ? 'max-w-[420px] h-[880px] rounded-[44px] ring-12 ring-slate-800/90 border-4 border-slate-700/60'
            : 'max-w-md min-h-screen sm:min-h-[850px] sm:rounded-3xl'
        } flex flex-col`}
      >
        {/* Android Punch Hole Camera & Status Bar */}
        <div className="w-full bg-inherit text-slate-700 px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold tracking-tight z-50 select-none">
          {/* Time */}
          <span>{currentTime}</span>

          {/* Centered Camera Punch Hole */}
          <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700 shadow-inner flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-amber-950/80"></div>
          </div>

          {/* Icons: 5G, Wi-Fi, Battery */}
          <div className="flex items-center gap-1.5 text-slate-600">
            <Signal size={12} strokeWidth={2.5} />
            <Wifi size={12} strokeWidth={2.5} />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">85%</span>
              <BatteryMedium size={14} strokeWidth={2.5} className="text-amber-500" />
            </div>
          </div>
        </div>

        {/* Screen Content Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative bg-[#FAF7F2]">
          {children}
        </div>

        {/* Android Gesture Bar */}
        <div className="w-full bg-inherit py-2 flex items-center justify-center pointer-events-none z-50">
          <div className="w-32 h-1 bg-slate-400/50 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
