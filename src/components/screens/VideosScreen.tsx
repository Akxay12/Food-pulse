import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Plus, Sparkles, Award, Play, Check, X, Store, Film, Upload } from 'lucide-react';
import { FoodVideo, FoodShop } from '../../types';

interface VideosScreenProps {
  videos: FoodVideo[];
  shops?: FoodShop[];
  onToggleLikeVideo: (videoId: string) => void;
  onUploadVideo: (video: Partial<FoodVideo>) => void;
  userVideoCount: number;
}

export const VideosScreen: React.FC<VideosScreenProps> = ({
  videos,
  shops = [],
  onToggleLikeVideo,
  onUploadVideo,
  userVideoCount
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [commentingVideoId, setCommentingVideoId] = useState<string | null>(null);

  // Upload Form State
  const [foodTitle, setFoodTitle] = useState('');
  const [selectedShopName, setSelectedShopName] = useState('');
  const [caption, setCaption] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80');

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodTitle.trim()) return;

    onUploadVideo({
      foodName: foodTitle.trim(),
      shopName: selectedShopName || 'Local Street Food Stall',
      caption: caption.trim() || 'Checked food freshness on FoodCheck! Verified spot.',
      thumbnailUrl
    });

    setShowUploadModal(false);
    setFoodTitle('');
    setSelectedShopName('');
    setCaption('');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white relative select-none overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-950/80 backdrop-blur-md px-4 py-3 border-b border-slate-800/80 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <h2 className="text-base font-black tracking-tight text-white">
            Food Community
          </h2>
        </div>

        {/* Food Vlogger Gamification Badge Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
          <Award size={13} className="text-amber-400" />
          <span>{userVideoCount}/5 Vlogger Goal</span>
        </div>
      </div>

      {/* Videos Feed (Snap scrollable vertical feed) */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 pb-20">
        {videos.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
            <Film size={40} className="text-slate-600 mb-2 opacity-60" />
            <h4 className="text-sm font-bold text-slate-300">No food videos yet</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">Be the first to share a street food discovery!</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Upload Food Clip
            </button>
          </div>
        ) : (
          videos.map((vid) => (
            <div key={vid.id} className="relative p-4 flex flex-col bg-slate-900/60">
              {/* Video Player Mockup Container */}
              <div className="relative w-full h-80 rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
                <img
                  src={vid.thumbnailUrl}
                  alt={vid.foodName}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40"></div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 backdrop-blur-md flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform cursor-pointer">
                    <Play size={26} className="fill-white translate-x-0.5" />
                  </div>
                </div>

                {/* Verified Food Badge Top Left */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1 text-[10px] font-bold text-amber-300">
                  <Sparkles size={11} />
                  <span>FoodCheck Verified</span>
                </div>

                {/* Action Buttons Column Right */}
                <div className="absolute right-3 bottom-6 flex flex-col items-center gap-4 z-20">
                  {/* Like */}
                  <button
                    onClick={() => onToggleLikeVideo(vid.id)}
                    className="flex flex-col items-center gap-0.5 group active:scale-125 transition-transform cursor-pointer"
                  >
                    <div
                      className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-colors ${
                        vid.isLiked
                          ? 'bg-red-500 text-white shadow-md'
                          : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                    >
                      <Heart size={20} className={vid.isLiked ? 'fill-current' : ''} />
                    </div>
                    <span className="text-[11px] font-bold text-white shadow-xs">
                      {vid.likes}
                    </span>
                  </button>

                  {/* Comments */}
                  <button
                    onClick={() =>
                      setCommentingVideoId(commentingVideoId === vid.id ? null : vid.id)
                    }
                    className="flex flex-col items-center gap-0.5 active:scale-110 transition-transform cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70">
                      <MessageCircle size={20} />
                    </div>
                    <span className="text-[11px] font-bold text-white shadow-xs">
                      {vid.commentsCount}
                    </span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: vid.foodName, text: vid.caption }).catch(() => {});
                      }
                    }}
                    className="flex flex-col items-center gap-0.5 active:scale-110 transition-transform cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70">
                      <Share2 size={19} />
                    </div>
                    <span className="text-[11px] font-bold text-white shadow-xs">
                      {vid.sharesCount}
                    </span>
                  </button>
                </div>

                {/* Author & Caption Bottom Overlay */}
                <div className="absolute left-3 bottom-3 right-16 z-20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <img
                      src={vid.authorAvatar}
                      alt={vid.authorName}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-500"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {vid.authorName}
                      </h4>
                      <span className="text-[10px] text-amber-400 font-semibold">
                        {vid.authorUsername}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-white/95 line-clamp-2 leading-relaxed">
                    {vid.caption}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-300 font-medium">
                    <Store size={11} className="text-amber-400" />
                    <span className="truncate">{vid.shopName}</span>
                  </div>
                </div>
              </div>

              {/* In-feed Commenting Drawer */}
              {commentingVideoId === vid.id && (
                <div className="mt-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                    <span>Community Comments</span>
                    <button onClick={() => setCommentingVideoId(null)} className="cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="text-xs space-y-1.5 py-1">
                    <p className="text-slate-300">
                      <strong className="text-amber-400">@ankit_eats:</strong> The hygiene score on FoodCheck was spot on!
                    </p>
                    <p className="text-slate-300">
                      <strong className="text-amber-400">@ruchika:</strong> Love their fresh chutneys and clean oil!
                    </p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add a friendly comment..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden"
                    />
                    <button className="bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer">
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button: + Upload Video */}
      <button
        onClick={() => setShowUploadModal(true)}
        className="absolute bottom-4 right-4 z-30 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-bold text-xs shadow-xl shadow-orange-500/30 flex items-center gap-2 border border-amber-400/40 transition-all cursor-pointer"
      >
        <Plus size={18} strokeWidth={2.6} />
        <span>Upload Video</span>
      </button>

      {/* Upload Video Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Film size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Upload Food Video / Vlog
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Food Dish Name
                </label>
                <input
                  type="text"
                  value={foodTitle}
                  onChange={(e) => setFoodTitle(e.target.value)}
                  placeholder="e.g. Special Butter Vada Pav"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Associated Stall / Shop (Optional)
                </label>
                <input
                  type="text"
                  value={selectedShopName}
                  onChange={(e) => setSelectedShopName(e.target.value)}
                  placeholder="e.g. Shree Snacks & Sweets"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Caption & Freshness Notes
                </label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tell the community about taste, fresh ingredients, and hygiene..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-dashed border-amber-500/40 text-center">
                <Check size={16} className="text-amber-400 mx-auto mb-1" />
                <span className="text-[11px] text-amber-300 font-bold block">
                  Gallery Food Video Attached
                </span>
                <span className="text-[10px] text-slate-500">
                  Ready to publish to FoodCheck feed
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                Publish & Earn Food Vlogger XP
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
