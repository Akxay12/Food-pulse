import React from 'react';
import { Home, MapPin, PlaySquare, User } from 'lucide-react';
import { AppScreen } from '../../types';

interface BottomNavProps {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  langNavMap?: {
    home: string;
    map: string;
    videos: string;
    profile: string;
  };
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeScreen,
  onNavigate,
  langNavMap = { home: 'Home', map: 'Map', videos: 'Videos', profile: 'Profile' }
}) => {
  const tabs: { id: AppScreen; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: langNavMap.home, icon: <Home size={21} /> },
    { id: 'map', label: langNavMap.map, icon: <MapPin size={21} /> },
    { id: 'videos', label: langNavMap.videos, icon: <PlaySquare size={21} /> },
    { id: 'profile', label: langNavMap.profile, icon: <User size={21} /> },
  ];

  return (
    <div
      className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 pt-2 flex items-center justify-around shadow-lg shadow-slate-900/5 flex-shrink-0"
      style={{ paddingBottom: 'max(0.5rem, calc(0.25rem + env(safe-area-inset-bottom, 0px)))' }}
    >
      {tabs.map((tab) => {
        const isActive = activeScreen === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl min-w-[64px] min-h-[44px] transition-all ${
              isActive
                ? 'text-orange-600 font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isActive ? 'bg-orange-50 text-orange-600 shadow-xs scale-105' : ''
              }`}
            >
              {tab.icon}
            </div>
            <span className="text-[11px] leading-none tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
