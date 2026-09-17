import React from 'react';
import { ArrowLeft, Award, ThumbsUp, Camera, Store, CheckCheck, Bell } from 'lucide-react';
import { AppNotification } from '../../types';

interface NotificationsScreenProps {
  notifications: AppNotification[];
  onBack: () => void;
  onMarkAllRead: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  onBack,
  onMarkAllRead
}) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FAF7F2] text-slate-900 overflow-y-auto select-none">
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
          Notifications
        </h2>
        <button
          onClick={onMarkAllRead}
          className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
        >
          <CheckCheck size={14} />
          <span>Read All</span>
        </button>
      </div>

      <div className="p-4 space-y-2.5 pb-12">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Bell size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold">No notifications right now</p>
          </div>
        ) : (
          notifications.map((n) => {
            const getIcon = () => {
              switch (n.type) {
                case 'badge':
                  return <Award size={18} className="text-amber-600" />;
                case 'like':
                  return <ThumbsUp size={18} className="text-blue-600" />;
                case 'scan':
                  return <Camera size={18} className="text-orange-500" />;
                case 'shop':
                  return <Store size={18} className="text-purple-600" />;
                default:
                  return <Bell size={18} className="text-slate-600" />;
              }
            };

            const getBg = () => {
              switch (n.type) {
                case 'badge':
                  return 'bg-amber-100';
                case 'like':
                  return 'bg-blue-100';
                case 'scan':
                  return 'bg-amber-100';
                case 'shop':
                  return 'bg-purple-100';
                default:
                  return 'bg-slate-100';
              }
            };

            return (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  n.read
                    ? 'bg-white border-slate-200/70 shadow-2xs'
                    : 'bg-amber-50/70 border-amber-300 shadow-xs'
                } flex items-start gap-3`}
              >
                <div
                  className={`w-9 h-9 rounded-xl ${getBg()} flex items-center justify-center flex-shrink-0 mt-0.5`}
                >
                  {getIcon()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium ml-2 flex-shrink-0">
                      {n.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {n.body}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
