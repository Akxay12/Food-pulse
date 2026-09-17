import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { ReviewDocument } from '../types';
import { userService } from './userService';

const STORAGE_REVIEWS_KEY = 'foodcheck_local_reviews';
const STORAGE_LIKES_KEY = 'foodcheck_local_review_likes';
const STORAGE_DISLIKES_KEY = 'foodcheck_local_review_dislikes';

// Seed initial reviews if none exist in local storage
function getLocalReviews(): ReviewDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_REVIEWS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }

  const initial: ReviewDocument[] = [];
  saveLocalReviews(initial);
  return initial;
}

function saveLocalReviews(reviews: ReviewDocument[]) {
  try {
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(reviews));
  } catch {
    // Ignore
  }
}

function getLocalReactions(key: string): Record<string, Record<string, boolean>> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalReactions(key: string, data: Record<string, Record<string, boolean>>) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore
  }
}

export const reviewService = {
  /**
   * Create a new Food or Shop review
   */
  async createReview(data: {
    userId: string;
    userName: string;
    userProfileImage?: string;
    targetId: string;
    targetType: 'food' | 'shop';
    rating: number;
    subRatings?: Record<string, number>;
    reviewText: string;
    photoUrl?: string;
  }): Promise<ReviewDocument> {
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new Error('Rating is required between 1 and 5 stars.');
    }
    if (!data.targetId) {
      throw new Error('Target shop or food item must be selected.');
    }

    const reviewId = 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newReview: ReviewDocument = {
      reviewId,
      userId: data.userId,
      userName: data.userName,
      userProfileImage: data.userProfileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      targetId: data.targetId,
      targetType: data.targetType,
      rating: data.rating,
      subRatings: data.subRatings || {},
      reviewText: data.reviewText.trim(),
      photoUrl: data.photoUrl,
      likesCount: 0,
      dislikesCount: 0,
      createdAt: new Date().toISOString(),
      userReaction: null
    };

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && db) {
      try {
        const reviewRef = doc(db, 'reviews', reviewId);
        await setDoc(reviewRef, newReview);
        await userService.incrementUserReviewCount(data.userId, 1);
        
        // Also keep in local storage so it is immediately available
        const local = getLocalReviews();
        local.unshift(newReview);
        saveLocalReviews(local);

        return newReview;
      } catch (err: any) {
        console.warn('Failed to save review to Cloud Firestore, falling back to local:', err);
      }
    }

    // LOCAL FALLBACK PATH
    await new Promise((res) => setTimeout(res, 350));
    const local = getLocalReviews();
    local.unshift(newReview);
    saveLocalReviews(local);
    await userService.incrementUserReviewCount(data.userId, 1);
    return newReview;
  },

  /**
   * Retrieve dynamic reviews for a shop or food item
   */
  async getReviews(
    targetId: string,
    targetType?: 'food' | 'shop',
    currentUserId?: string
  ): Promise<ReviewDocument[]> {
    let reviews: ReviewDocument[] = [];
    let firestoreSuccess = false;

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && db) {
      try {
        const reviewsRef = collection(db, 'reviews');
        let q = query(
          reviewsRef,
          where('targetId', '==', targetId)
        );
        if (targetType) {
          q = query(
            reviewsRef,
            where('targetId', '==', targetId),
            where('targetType', '==', targetType)
          );
        }
        const querySnapshot = await getDocs(q);

        for (const docSnap of querySnapshot.docs) {
          const rev = docSnap.data() as ReviewDocument;
          // Check reaction for current user if logged in
          if (currentUserId) {
            try {
              const likeDoc = await getDoc(doc(db, 'reviews', rev.reviewId, 'likes', currentUserId));
              if (likeDoc.exists()) {
                rev.userReaction = 'like';
              } else {
                const dislikeDoc = await getDoc(doc(db, 'reviews', rev.reviewId, 'dislikes', currentUserId));
                if (dislikeDoc.exists()) {
                  rev.userReaction = 'dislike';
                }
              }
            } catch {
              // Ignore reaction check failure
            }
          }
          reviews.push(rev);
        }
        firestoreSuccess = true;
      } catch (err: any) {
        console.warn('Failed to fetch reviews from Firestore, merging local fallback:', err);
      }
    }

    // LOCAL MERGE / FALLBACK PATH
    const local = getLocalReviews();
    const likes = getLocalReactions(STORAGE_LIKES_KEY);
    const dislikes = getLocalReactions(STORAGE_DISLIKES_KEY);

    const filteredLocal = local.filter((r) => {
      const matchTarget = r.targetId === targetId;
      return targetType ? matchTarget && r.targetType === targetType : matchTarget;
    });

    const localMapped = filteredLocal.map((r) => {
      let reaction: 'like' | 'dislike' | null = null;
      if (currentUserId) {
        if (likes[r.reviewId]?.[currentUserId]) reaction = 'like';
        else if (dislikes[r.reviewId]?.[currentUserId]) reaction = 'dislike';
      }
      return { ...r, userReaction: reaction };
    });

    if (!firestoreSuccess) {
      reviews = localMapped;
    } else {
      // Merge any local reviews that might not yet be synced to Firestore
      for (const loc of localMapped) {
        if (!reviews.some((r) => r.reviewId === loc.reviewId)) {
          reviews.push(loc);
        }
      }
    }

    // Sort descending by date in memory
    reviews.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return reviews;
  },

  /**
   * Toggle Like Reaction (Module 1K)
   */
  async toggleLikeReview(reviewId: string, userId: string): Promise<{ likesCount: number; dislikesCount: number; userReaction: 'like' | null }> {
    if (!userId) throw new Error('You must be logged in to like a review.');

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && db) {
      try {
        return await runTransaction(db, async (transaction) => {
          const reviewRef = doc(db, 'reviews', reviewId);
          const likeRef = doc(db, 'reviews', reviewId, 'likes', userId);
          const dislikeRef = doc(db, 'reviews', reviewId, 'dislikes', userId);

          const reviewDoc = await transaction.get(reviewRef);
          if (!reviewDoc.exists()) throw new Error('Review does not exist.');

          const reviewData = reviewDoc.data() as ReviewDocument;
          const likeDoc = await transaction.get(likeRef);
          const dislikeDoc = await transaction.get(dislikeRef);

          let likesCount = reviewData.likesCount || 0;
          let dislikesCount = reviewData.dislikesCount || 0;
          let userReaction: 'like' | null = null;

          if (likeDoc.exists()) {
            // User already liked -> Toggle OFF
            transaction.delete(likeRef);
            likesCount = Math.max(0, likesCount - 1);
            userReaction = null;
          } else {
            // Add Like
            transaction.set(likeRef, { userId, createdAt: new Date().toISOString() });
            likesCount += 1;
            userReaction = 'like';

            // If was disliked, remove dislike
            if (dislikeDoc.exists()) {
              transaction.delete(dislikeRef);
              dislikesCount = Math.max(0, dislikesCount - 1);
            }
          }

          transaction.update(reviewRef, { likesCount, dislikesCount });
          return { likesCount, dislikesCount, userReaction };
        });
      } catch (err: any) {
        console.warn('Firebase transaction failed for like, using local fallback:', err);
      }
    }

    // LOCAL FALLBACK PATH
    const local = getLocalReviews();
    const likes = getLocalReactions(STORAGE_LIKES_KEY);
    const dislikes = getLocalReactions(STORAGE_DISLIKES_KEY);

    const review = local.find((r) => r.reviewId === reviewId);
    if (!review) throw new Error('Review not found.');

    if (!likes[reviewId]) likes[reviewId] = {};
    if (!dislikes[reviewId]) dislikes[reviewId] = {};

    let userReaction: 'like' | null = null;

    if (likes[reviewId][userId]) {
      // Toggle OFF
      delete likes[reviewId][userId];
      review.likesCount = Math.max(0, (review.likesCount || 1) - 1);
      userReaction = null;
    } else {
      // Toggle ON
      likes[reviewId][userId] = true;
      review.likesCount = (review.likesCount || 0) + 1;
      userReaction = 'like';

      if (dislikes[reviewId][userId]) {
        delete dislikes[reviewId][userId];
        review.dislikesCount = Math.max(0, (review.dislikesCount || 1) - 1);
      }
    }

    saveLocalReviews(local);
    saveLocalReactions(STORAGE_LIKES_KEY, likes);
    saveLocalReactions(STORAGE_DISLIKES_KEY, dislikes);

    return { likesCount: review.likesCount, dislikesCount: review.dislikesCount, userReaction };
  },

  /**
   * Toggle Dislike Reaction (Module 1K)
   */
  async toggleDislikeReview(reviewId: string, userId: string): Promise<{ likesCount: number; dislikesCount: number; userReaction: 'dislike' | null }> {
    if (!userId) throw new Error('You must be logged in to dislike a review.');

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && db) {
      try {
        return await runTransaction(db, async (transaction) => {
          const reviewRef = doc(db, 'reviews', reviewId);
          const likeRef = doc(db, 'reviews', reviewId, 'likes', userId);
          const dislikeRef = doc(db, 'reviews', reviewId, 'dislikes', userId);

          const reviewDoc = await transaction.get(reviewRef);
          if (!reviewDoc.exists()) throw new Error('Review does not exist.');

          const reviewData = reviewDoc.data() as ReviewDocument;
          const likeDoc = await transaction.get(likeRef);
          const dislikeDoc = await transaction.get(dislikeRef);

          let likesCount = reviewData.likesCount || 0;
          let dislikesCount = reviewData.dislikesCount || 0;
          let userReaction: 'dislike' | null = null;

          if (dislikeDoc.exists()) {
            // Toggle OFF
            transaction.delete(dislikeRef);
            dislikesCount = Math.max(0, dislikesCount - 1);
            userReaction = null;
          } else {
            // Add Dislike
            transaction.set(dislikeRef, { userId, createdAt: new Date().toISOString() });
            dislikesCount += 1;
            userReaction = 'dislike';

            // If was liked, remove like
            if (likeDoc.exists()) {
              transaction.delete(likeRef);
              likesCount = Math.max(0, likesCount - 1);
            }
          }

          transaction.update(reviewRef, { likesCount, dislikesCount });
          return { likesCount, dislikesCount, userReaction };
        });
      } catch (err: any) {
        console.warn('Firebase transaction failed for dislike, using local fallback:', err);
      }
    }

    // LOCAL FALLBACK PATH
    const local = getLocalReviews();
    const likes = getLocalReactions(STORAGE_LIKES_KEY);
    const dislikes = getLocalReactions(STORAGE_DISLIKES_KEY);

    const review = local.find((r) => r.reviewId === reviewId);
    if (!review) throw new Error('Review not found.');

    if (!likes[reviewId]) likes[reviewId] = {};
    if (!dislikes[reviewId]) dislikes[reviewId] = {};

    let userReaction: 'dislike' | null = null;

    if (dislikes[reviewId][userId]) {
      // Toggle OFF
      delete dislikes[reviewId][userId];
      review.dislikesCount = Math.max(0, (review.dislikesCount || 1) - 1);
      userReaction = null;
    } else {
      // Toggle ON
      dislikes[reviewId][userId] = true;
      review.dislikesCount = (review.dislikesCount || 0) + 1;
      userReaction = 'dislike';

      if (likes[reviewId][userId]) {
        delete likes[reviewId][userId];
        review.likesCount = Math.max(0, (review.likesCount || 1) - 1);
      }
    }

    saveLocalReviews(local);
    saveLocalReactions(STORAGE_LIKES_KEY, likes);
    saveLocalReactions(STORAGE_DISLIKES_KEY, dislikes);

    return { likesCount: review.likesCount, dislikesCount: review.dislikesCount, userReaction };
  },

  /**
   * Delete a review with strict ownership validation (Module 1L)
   */
  async deleteReview(reviewId: string, currentUserId: string): Promise<void> {
    if (!currentUserId) throw new Error('Authentication required.');

    // LIVE FIREBASE PATH
    if (isFirebaseConfigured && db) {
      try {
        const reviewRef = doc(db, 'reviews', reviewId);
        const reviewDoc = await getDoc(reviewRef);
        if (!reviewDoc.exists()) return;

        const data = reviewDoc.data() as ReviewDocument;
        if (data.userId !== currentUserId) {
          throw new Error('You do not have permission to delete this review.');
        }

        await deleteDoc(reviewRef);
        await userService.incrementUserReviewCount(currentUserId, -1);
        return;
      } catch (err: any) {
        console.warn('Firebase review deletion failed:', err);
      }
    }

    // LOCAL FALLBACK PATH
    const local = getLocalReviews();
    const review = local.find((r) => r.reviewId === reviewId);
    if (!review) return;

    if (review.userId !== currentUserId) {
      throw new Error('You do not have permission to delete this review.');
    }

    const updated = local.filter((r) => r.reviewId !== reviewId);
    saveLocalReviews(updated);
    await userService.incrementUserReviewCount(currentUserId, -1);
  },

  /**
   * Get total review count for a user (Module 1F)
   */
  async getUserReviewCount(userId: string): Promise<number> {
    if (!userId) return 0;

    if (isFirebaseConfigured && db) {
      try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.size;
      } catch (err) {
        console.warn('Error querying user review count in Firestore:', err);
      }
    }

    const local = getLocalReviews();
    return local.filter((r) => r.userId === userId).length;
  },

  /**
   * Get all reviews authored by a user and total helpful likes received
   */
  async getUserReviewsAndLikes(userId: string): Promise<{ reviews: ReviewDocument[]; totalLikes: number }> {
    const effectiveUid = userId || auth?.currentUser?.uid;
    if (!effectiveUid) return { reviews: [], totalLikes: 0 };

    let reviews: ReviewDocument[] = [];
    if (isFirebaseConfigured && db) {
      try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, where('userId', '==', effectiveUid));
        const snapshot = await getDocs(q);
        reviews = snapshot.docs.map((d) => d.data() as ReviewDocument);
      } catch (err) {
        console.warn('Error fetching user reviews from Firestore:', err);
      }
    }

    // Merge any local reviews for effectiveUid that might not be synced yet
    const local = getLocalReviews();
    const userLocal = local.filter((r) => r.userId === effectiveUid);
    for (const loc of userLocal) {
      if (!reviews.some((r) => r.reviewId === loc.reviewId)) {
        reviews.push(loc);
      }
    }

    reviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const totalLikes = reviews.reduce((sum, r) => sum + (r.likesCount || 0), 0);
    return { reviews, totalLikes };
  },

  /**
   * Calculate shop ratings (overall, food quality, hygiene) from reviews
   */
  async calculateShopRatings(shopId: string): Promise<{
    rating: number;
    foodQualityRating: number;
    hygieneRating: number;
    reviewsCount: number;
  }> {
    const reviews = await this.getReviews(shopId);
    if (reviews.length === 0) {
      return { rating: 0, foodQualityRating: 0, hygieneRating: 0, reviewsCount: 0 };
    }

    let totalRating = 0;
    let totalHygiene = 0;
    let hygieneCount = 0;
    let totalFood = 0;
    let foodCount = 0;

    for (const r of reviews) {
      totalRating += r.rating;
      if (r.subRatings?.Hygiene) {
        totalHygiene += r.subRatings.Hygiene;
        hygieneCount++;
      }
      if (r.subRatings?.Cleanliness) {
        totalHygiene += r.subRatings.Cleanliness;
        hygieneCount++;
      }
      if (r.subRatings?.Taste || r.subRatings?.Freshness || r.subRatings?.Quality) {
        const foodAvg = ((r.subRatings.Taste || 0) + (r.subRatings.Freshness || 0) + (r.subRatings.Quality || 0)) /
          ((r.subRatings.Taste ? 1 : 0) + (r.subRatings.Freshness ? 1 : 0) + (r.subRatings.Quality ? 1 : 0) || 1);
        totalFood += foodAvg;
        foodCount++;
      }
    }

    const avgRating = Number((totalRating / reviews.length).toFixed(1));
    const avgHygiene = hygieneCount > 0 ? Number((totalHygiene / hygieneCount).toFixed(1)) : avgRating;
    const avgFood = foodCount > 0 ? Number((totalFood / foodCount).toFixed(1)) : avgRating;

    return {
      rating: avgRating,
      foodQualityRating: avgFood,
      hygieneRating: avgHygiene,
      reviewsCount: reviews.length
    };
  }
};
