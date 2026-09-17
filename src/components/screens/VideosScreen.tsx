import React, { useState, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Sparkles,
  Award,
  Play,
  Pause,
  Check,
  X,
  Store,
  Film,
  Upload,
  Camera,
  Loader2,
  AlertCircle,
  Video as VideoIcon
} from 'lucide-react';
import { FoodVideo, FoodShop } from '../../types';

interface VideosScreenProps {
  videos: FoodVideo[];
  shops?: FoodShop[];
  onToggleLikeVideo: (videoId: string) => void;
  onUploadVideo: (
    video: Partial<FoodVideo> & { videoFile?: File | Blob; thumbnailFile?: File | Blob },
    onProgress?: (progress: number) => void
  ) => Promise<FoodVideo | void> | void;
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
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Upload Form State
  const [foodTitle, setFoodTitle] = useState('');
  const [selectedShopName, setSelectedShopName] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [selectedThumbFile, setSelectedThumbFile] = useState<File | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);

  // Status State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        setErrorMessage('Video file size exceeds 100MB limit.');
        return;
      }
      setSelectedVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleThumbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedThumbFile(file);
      setThumbPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodTitle.trim()) {
      setErrorMessage('Please enter a dish name.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      await onUploadVideo(
        {
          foodName: foodTitle.trim(),
          shopName: selectedShopName.trim() || 'Local Street Food Stall',
          caption: caption.trim() || 'Checked food freshness on FoodCheck! Verified spot.',
          videoFile: selectedVideoFile || undefined,
          thumbnailFile: selectedThumbFile || undefined,
          videoUrl: videoPreviewUrl || undefined,
          thumbnailUrl: thumbPreviewUrl || 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80'
        },
        (progress) => {
          setUploadProgress(Math.round(progress));
        }
      );

      // Reset and close
      setIsUploading(false);
      setShowUploadModal(false);
      setFoodTitle('');
      setSelectedShopName('');
      setCaption('');
      setSelectedVideoFile(null);
      setVideoPreviewUrl(null);
      setSelectedThumbFile(null);
      setThumbPreviewUrl(null);
      setUploadProgress(0);
    } catch (err: any) {
      setIsUploading(false);
      setErrorMessage(err.message || 'Failed to upload video to Firebase.');
    }
  };

  const togglePlay = (vidId: string) => {
    setPlayingVideoId((prev) => (prev === vidId ? null : vidId));
  };

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col bg-slate-950 text-white relative select-none overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-950/80 backdrop-blur-md px-4 py-3 border-b border-slate-800/80 sticky top-0 z-30 flex items-center justify-between flex-shrink-0">
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
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-800/80 pb-24 overscroll-contain">
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
          videos.map((vid) => {
            const isPlaying = playingVideoId === vid.id;
            const hasRealVideo = Boolean(vid.videoUrl);

            return (
              <div key={vid.id} className="relative p-4 flex flex-col bg-slate-900/60">
                {/* Video Player Container */}
                <div
                  onClick={() => togglePlay(vid.id)}
                  className="relative w-full h-80 rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group cursor-pointer"
                >
                  {isPlaying && hasRealVideo ? (
                    <video
                      src={vid.videoUrl}
                      poster={vid.thumbnailUrl}
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.foodName}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none"></div>

                  {/* Play/Pause Overlay Indicator */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 backdrop-blur-md flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                      {isPlaying ? (
                        <Pause size={24} className="fill-white" />
                      ) : (
                        <Play size={24} className="fill-white translate-x-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Verified Food Badge Top Left */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1 text-[10px] font-bold text-amber-300 pointer-events-none">
                    <Sparkles size={11} />
                    <span>FoodCheck Verified</span>
                  </div>

                  {/* Action Buttons Column Right */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-3 bottom-6 flex flex-col items-center gap-4 z-20"
                  >
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
                  <div className="absolute left-3 bottom-3 right-16 z-20 pointer-events-none">
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
            );
          })
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100 animate-fade-in my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Film size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Upload Food Video / Vlog
                </h3>
              </div>
              <button
                onClick={() => !isUploading && setShowUploadModal(false)}
                disabled={isUploading}
                className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-3 p-2.5 bg-red-950/80 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              {/* Hidden file inputs */}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoFileChange}
                className="hidden"
              />
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbFileChange}
                className="hidden"
              />

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Food Dish Name *
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

              {/* Video File Picker Area */}
              <div
                onClick={() => videoInputRef.current?.click()}
                className="p-3 bg-slate-950 rounded-xl border border-dashed border-amber-500/50 hover:border-amber-400 text-center cursor-pointer transition-colors"
              >
                {selectedVideoFile ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-left truncate">
                      <VideoIcon size={18} className="text-amber-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-[11px] font-bold text-amber-300 block truncate">
                          {selectedVideoFile.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB • Video Ready
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        videoInputRef.current?.click();
                      }}
                      className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-1 rounded-lg"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <Camera size={18} className="text-amber-400 mx-auto mb-1" />
                    <span className="text-[11px] text-amber-300 font-bold block">
                      Choose Video / Record Clip
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Tap to select MP4, WebM or record camera clip (Cloud Storage)
                    </span>
                  </div>
                )}
              </div>

              {/* Optional Thumbnail Picker Area */}
              <div
                onClick={() => thumbInputRef.current?.click()}
                className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-center cursor-pointer hover:border-slate-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-left truncate">
                  <Film size={14} className="text-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-300 truncate">
                    {selectedThumbFile ? selectedThumbFile.name : 'Add Cover / Thumbnail Photo'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                  {selectedThumbFile ? 'Attached' : 'Optional'}
                </span>
              </div>

              {/* Upload Progress Indicator */}
              {isUploading && (
                <div className="space-y-1.5 py-1">
                  <div className="flex justify-between text-[10px] font-bold text-amber-300">
                    <span className="flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" /> Uploading to Firebase Storage...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                      style={{ width: `${Math.max(5, uploadProgress)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Publishing Video ({uploadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    <span>Publish & Earn Food Vlogger XP</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
