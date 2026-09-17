import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  runTransaction
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from './firebase';
import { FoodVideo, VideoDocument } from '../types';
import { INITIAL_VIDEOS } from '../data/mockData';
import { userService } from './userService';

const STORAGE_VIDEOS_KEY = 'foodcheck_local_videos';
const STORAGE_VIDEO_LIKES_KEY = 'foodcheck_local_video_likes';

function getLocalVideos(): FoodVideo[] {
  try {
    const raw = localStorage.getItem(STORAGE_VIDEOS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }

  const initial = INITIAL_VIDEOS.map((v) => ({ ...v }));
  saveLocalVideos(initial);
  return initial;
}

function saveLocalVideos(videos: FoodVideo[]) {
  try {
    localStorage.setItem(STORAGE_VIDEOS_KEY, JSON.stringify(videos));
  } catch {
    // Ignore
  }
}

function getLocalVideoLikes(): Record<string, Record<string, boolean>> {
  try {
    const raw = localStorage.getItem(STORAGE_VIDEO_LIKES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalVideoLikes(data: Record<string, Record<string, boolean>>) {
  try {
    localStorage.setItem(STORAGE_VIDEO_LIKES_KEY, JSON.stringify(data));
  } catch {
    // Ignore
  }
}

export const videoService = {
  /**
   * Upload raw video file directly to Firebase Storage bucket: videos/{userId}/{timestamp}_{filename}
   */
  async uploadVideoFileToStorage(
    file: File | Blob,
    userId: string,
    customFileName?: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    if (isFirebaseConfigured && storage && userId) {
      try {
        const timestamp = Date.now();
        const rawName = (file as File).name || 'food_discovery_clip.mp4';
        const cleanName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `videos/${userId}/${timestamp}_${customFileName || cleanName}`;
        const storageRef = ref(storage, path);

        const contentType = file.type || 'video/mp4';
        const metadata = { contentType };

        if (onProgress) {
          const uploadTask = uploadBytesResumable(storageRef, file, metadata);
          return await new Promise<string>((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                if (snapshot.totalBytes > 0) {
                  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                  onProgress(progress);
                }
              },
              (error) => {
                console.warn('Firebase Storage uploadTask error:', error);
                reject(error);
              },
              async () => {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadUrl);
              }
            );
          });
        } else {
          const snap = await uploadBytes(storageRef, file, metadata);
          return await getDownloadURL(snap.ref);
        }
      } catch (err) {
        console.warn('Firebase Storage video upload error, using object URL fallback:', err);
      }
    }

    if (file && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        return URL.createObjectURL(file);
      } catch {
        // Fallback
      }
    }
    return 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-bowl-of-soup-42938-large.mp4';
  },

  /**
   * Upload video thumbnail image to Firebase Storage: thumbnails/{userId}/{timestamp}_{filename}
   */
  async uploadThumbnailToStorage(
    file: File | Blob,
    userId: string
  ): Promise<string> {
    if (isFirebaseConfigured && storage && userId) {
      try {
        const timestamp = Date.now();
        const rawName = (file as File).name || 'thumbnail.jpg';
        const cleanName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `thumbnails/${userId}/${timestamp}_${cleanName}`;
        const storageRef = ref(storage, path);
        const contentType = file.type || 'image/jpeg';
        const snap = await uploadBytes(storageRef, file, { contentType });
        return await getDownloadURL(snap.ref);
      } catch (err) {
        console.warn('Firebase Storage thumbnail upload error:', err);
      }
    }

    if (file && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        return URL.createObjectURL(file);
      } catch {
        // Fallback
      }
    }
    return 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80';
  },

  /**
   * Fetch video feed with like status for current user
   */
  async getVideos(currentUserId?: string): Promise<FoodVideo[]> {
    let videosList: FoodVideo[] = [];

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && db) {
      try {
        const videosRef = collection(db, 'videos');
        const q = query(videosRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data() as VideoDocument;
            let isLiked = false;

            if (currentUserId) {
              const likeDoc = await getDoc(doc(db, 'videos', data.videoId, 'likes', currentUserId));
              isLiked = likeDoc.exists();
            }

            videosList.push({
              id: data.videoId,
              userId: data.userId,
              videoUrl: data.videoUrl,
              thumbnailUrl: data.thumbnailUrl,
              authorName: data.userName,
              authorUsername: data.userName ? `@${data.userName.toLowerCase().replace(/\s+/g, '_')}` : '@foodie',
              authorAvatar: data.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              foodName: data.foodName,
              shopName: data.shopName || 'Local Street Stall',
              shopId: data.shopId,
              caption: data.caption,
              likes: data.likesCount || 0,
              isLiked,
              commentsCount: data.commentsCount || 0,
              sharesCount: data.sharesCount || 0,
              postedTime: 'Recently',
              tags: ['FoodCheck', 'StreetFood', 'VerifiedHygiene']
            });
          }
          return videosList;
        }
      } catch (err) {
        console.warn('Failed to fetch videos from Firestore, falling back to local:', err);
      }
    }

    // LOCAL FALLBACK PATH
    const local = getLocalVideos();
    const likes = getLocalVideoLikes();

    return local.map((v) => {
      let isLiked = v.isLiked ?? false;
      if (currentUserId && likes[v.id]) {
        isLiked = Boolean(likes[v.id][currentUserId]);
      }
      return { ...v, isLiked };
    });
  },

  /**
   * Upload video, save media in Firebase Storage, persist metadata in Firestore, and increment user count
   */
  async uploadVideo(
    videoData: {
      foodName: string;
      shopName?: string;
      shopId?: string;
      caption?: string;
      thumbnailUrl?: string;
      videoUrl?: string;
      videoFile?: File | Blob;
      thumbnailFile?: File | Blob;
    },
    user: { uid: string; name: string; avatarUrl?: string },
    onProgress?: (progress: number) => void
  ): Promise<{ video: FoodVideo; totalVideosCount: number }> {
    const videoId = 'vid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    let finalVideoUrl = videoData.videoUrl;
    let finalThumbnailUrl = videoData.thumbnailUrl;

    // 1. Upload video file to Firebase Storage if provided
    if (videoData.videoFile) {
      try {
        finalVideoUrl = await this.uploadVideoFileToStorage(
          videoData.videoFile,
          user.uid,
          `${videoId}.mp4`,
          onProgress
        );
      } catch (err) {
        console.warn('Storage video upload failed:', err);
      }
    }

    // 2. Upload thumbnail file to Firebase Storage if provided
    if (videoData.thumbnailFile) {
      try {
        finalThumbnailUrl = await this.uploadThumbnailToStorage(
          videoData.thumbnailFile,
          user.uid
        );
      } catch (err) {
        console.warn('Storage thumbnail upload failed:', err);
      }
    }

    const defaultThumbnail = 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80';

    const videoDoc: VideoDocument = {
      videoId,
      userId: user.uid,
      userName: user.name,
      userAvatar: user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      videoUrl: finalVideoUrl,
      thumbnailUrl: finalThumbnailUrl || defaultThumbnail,
      foodName: videoData.foodName,
      caption: videoData.caption || 'Checked food freshness on FoodCheck!',
      shopId: videoData.shopId,
      shopName: videoData.shopName || 'Local Stall',
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: now
    };

    const newVideo: FoodVideo = {
      id: videoId,
      userId: user.uid,
      videoUrl: finalVideoUrl,
      thumbnailUrl: videoDoc.thumbnailUrl,
      authorName: user.name,
      authorUsername: `@${user.name.toLowerCase().replace(/\s+/g, '_')}`,
      authorAvatar: videoDoc.userAvatar || '',
      foodName: videoDoc.foodName,
      shopName: videoDoc.shopName || '',
      shopId: videoDoc.shopId,
      caption: videoDoc.caption,
      likes: 1,
      isLiked: true,
      commentsCount: 0,
      sharesCount: 0,
      postedTime: 'Just now',
      tags: ['FoodCheck', 'StreetFood', 'VerifiedSpot']
    };

    // Increment user contribution count
    const updatedCount = await userService.incrementUserVideoCount(user.uid, 1);

    // LIVE FIREBASE PATH: Store in Cloud Firestore
    if (isFirebaseConfigured && db) {
      try {
        const videoRef = doc(db, 'videos', videoId);
        await setDoc(videoRef, videoDoc);
        // Self-like registration
        const likeRef = doc(db, 'videos', videoId, 'likes', user.uid);
        await setDoc(likeRef, { userId: user.uid, createdAt: now });
        console.info('[FoodCheck] Live video registered in Firestore & Storage:', videoId);
        return { video: newVideo, totalVideosCount: updatedCount };
      } catch (err) {
        console.warn('Failed to upload video to Firestore, using local fallback:', err);
      }
    }

    // LOCAL FALLBACK PATH
    const local = getLocalVideos();
    local.unshift(newVideo);
    saveLocalVideos(local);

    const likes = getLocalVideoLikes();
    if (!likes[videoId]) likes[videoId] = {};
    likes[videoId][user.uid] = true;
    saveLocalVideoLikes(likes);

    return { video: newVideo, totalVideosCount: updatedCount };
  },

  /**
   * Toggle Like for a Video
   */
  async toggleLikeVideo(
    videoId: string,
    userId: string
  ): Promise<{ likesCount: number; isLiked: boolean }> {
    if (!userId) throw new Error('You must be logged in to like a video.');

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && db) {
      try {
        return await runTransaction(db, async (transaction) => {
          const videoRef = doc(db, 'videos', videoId);
          const likeRef = doc(db, 'videos', videoId, 'likes', userId);

          const videoSnap = await transaction.get(videoRef);
          if (!videoSnap.exists()) throw new Error('Video not found.');

          const videoData = videoSnap.data() as VideoDocument;
          const likeSnap = await transaction.get(likeRef);

          let likesCount = videoData.likesCount || 0;
          let isLiked = false;

          if (likeSnap.exists()) {
            // Unlike
            transaction.delete(likeRef);
            likesCount = Math.max(0, likesCount - 1);
            isLiked = false;
          } else {
            // Like
            transaction.set(likeRef, { userId, createdAt: new Date().toISOString() });
            likesCount += 1;
            isLiked = true;
          }

          transaction.update(videoRef, { likesCount });
          return { likesCount, isLiked };
        });
      } catch (err) {
        console.warn('Firebase transaction failed for video like, using local:', err);
      }
    }

    // LOCAL FALLBACK PATH
    const local = getLocalVideos();
    const likes = getLocalVideoLikes();

    const video = local.find((v) => v.id === videoId);
    if (!video) throw new Error('Video not found.');

    if (!likes[videoId]) likes[videoId] = {};

    let isLiked = false;
    if (likes[videoId][userId]) {
      delete likes[videoId][userId];
      video.likes = Math.max(0, video.likes - 1);
      video.isLiked = false;
      isLiked = false;
    } else {
      likes[videoId][userId] = true;
      video.likes += 1;
      video.isLiked = true;
      isLiked = true;
    }

    saveLocalVideos(local);
    saveLocalVideoLikes(likes);

    return { likesCount: video.likes, isLiked };
  },

  /**
   * Get total video count uploaded by user
   */
  async getUserVideoCount(userId: string): Promise<number> {
    if (!userId) return 0;

    if (isFirebaseConfigured && db) {
      try {
        const videosRef = collection(db, 'videos');
        const q = query(videosRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.size;
      } catch (err) {
        console.warn('Error querying user video count in Firestore:', err);
      }
    }

    const local = getLocalVideos();
    return local.filter((v) => v.userId === userId).length;
  },

  /**
   * Get all real videos uploaded by user
   */
  async getUserVideos(userId: string): Promise<FoodVideo[]> {
    if (!userId) return [];

    if (isFirebaseConfigured && db) {
      try {
        const videosRef = collection(db, 'videos');
        const q = query(videosRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const list: FoodVideo[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data() as VideoDocument;
          list.push({
            id: data.videoId || docSnap.id,
            userId: data.userId,
            videoUrl: data.videoUrl,
            thumbnailUrl: data.thumbnailUrl,
            authorName: data.userName,
            authorUsername: data.userName ? `@${data.userName.toLowerCase().replace(/\s+/g, '_')}` : '@foodie',
            authorAvatar: data.userAvatar || '',
            foodName: data.foodName,
            shopName: data.shopName || 'Local Street Food Stall',
            shopId: data.shopId,
            caption: data.caption,
            likes: data.likesCount || 0,
            isLiked: false,
            commentsCount: data.commentsCount || 0,
            sharesCount: data.sharesCount || 0,
            postedTime: data.createdAt ? new Date(data.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently',
            tags: ['FoodCheck']
          });
        }
        return list;
      } catch (err) {
        console.warn('Error querying user videos in Firestore:', err);
      }
    }

    const local = getLocalVideos();
    return local.filter((v) => v.userId === userId);
  }
};
