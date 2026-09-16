import { UserBadge, ReviewDocument } from '../types';

export interface BadgeEvaluationResult {
  badges: UserBadge[];
  foodVloggerUnlocked: boolean;
  superiorRaterUnlocked: boolean;
  superiorRaterLocked: boolean;
  lockReason?: string;
}

export const badgeService = {
  /**
   * Evaluate user badges based on real Firestore/local contribution data
   * 
   * Criteria:
   * 1. Food Vlogger: Unlocked when uploaded videos > 5.
   * 2. Superior Rater:
   *    - Unlocks when any review receives >= 100 likes.
   *    - Lock logic: If user posts subsequent reviews, all reviews posted > 48 hours ago
   *      must maintain at least 50 likes. If the latest review posted > 48h ago has < 50 likes,
   *      the badge locks with a clear explanation until community engagement catches up.
   */
  evaluateBadges(params: {
    videoCount: number;
    userReviews: ReviewDocument[];
    totalHelpfulLikes: number;
    scanCount?: number;
  }): BadgeEvaluationResult {
    const { videoCount, userReviews, totalHelpfulLikes, scanCount = 0 } = params;

    // 1. Food Vlogger Badge Logic (> 5 videos)
    const foodVloggerUnlocked = videoCount > 5;
    const vloggerBadge: UserBadge = {
      id: 'vlogger',
      title: 'Food Vlogger',
      description: 'Shared more than 5 food discovery videos with the FoodCheck community.',
      icon: '🏅',
      isUnlocked: foodVloggerUnlocked,
      unlockedDetail: foodVloggerUnlocked ? `${videoCount} food videos shared` : undefined,
      criteriaText: 'Upload 5+ food videos',
      currentCount: videoCount,
      targetCount: 5
    };

    // 2. Superior Rater Badge Logic
    // Find if user ever had a review with >= 100 likes
    const maxLikesOnSingleReview = userReviews.reduce((max, r) => Math.max(max, r.likesCount || 0), 0);
    const hasQualifying100LikeReview = maxLikesOnSingleReview >= 100 || totalHelpfulLikes >= 100;

    let superiorRaterUnlocked = false;
    let superiorRaterLocked = false;
    let lockReason = '';

    if (hasQualifying100LikeReview) {
      superiorRaterUnlocked = true;

      // Evaluation of subsequent reviews (if user posted more than 1 review)
      if (userReviews.length > 1) {
        // Sort reviews by creation time ascending
        const sortedReviews = [...userReviews].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Find qualifying review index
        const qualifyingIndex = sortedReviews.findIndex((r) => (r.likesCount || 0) >= 100);

        if (qualifyingIndex !== -1 && qualifyingIndex < sortedReviews.length - 1) {
          // There are subsequent reviews posted after the 100-like milestone
          const subsequentReviews = sortedReviews.slice(qualifyingIndex + 1);

          // Check if any subsequent review is older than grace period (e.g., 24 hours / 48 hours)
          const now = Date.now();
          const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours grace period for likes to accumulate

          for (const rev of subsequentReviews) {
            const ageMs = now - new Date(rev.createdAt).getTime();
            // If the subsequent review is older than grace period and failed to reach 50 likes:
            if (ageMs > GRACE_PERIOD_MS && (rev.likesCount || 0) < 50) {
              superiorRaterUnlocked = false;
              superiorRaterLocked = true;
              lockReason = `Subsequent review on "${rev.targetId}" received ${rev.likesCount}/50 likes. Maintain 50+ likes on new reviews to reactivate.`;
              break;
            }
          }
        }
      }
    }

    const raterBadge: UserBadge = {
      id: 'rater',
      title: 'Superior Rater',
      description: 'Your food reviews and ratings received 100+ helpful likes from community members.',
      icon: '⭐',
      isUnlocked: superiorRaterUnlocked,
      unlockedDetail: superiorRaterUnlocked
        ? `${Math.max(maxLikesOnSingleReview, totalHelpfulLikes)} helpful likes received`
        : undefined,
      criteriaText: 'Receive 100+ helpful review likes',
      currentCount: Math.max(maxLikesOnSingleReview, totalHelpfulLikes),
      targetCount: 100,
      isLockedDueToCondition: superiorRaterLocked,
      lockExplanation: lockReason
    };

    // 3. Safety Pioneer Badge (20 scans)
    const safetyPioneerBadge: UserBadge = {
      id: 'scanner_pro',
      title: 'Safety Pioneer',
      description: 'Conducted 20+ AI safety scans helping map hygiene trends across town.',
      icon: '🛡️',
      isUnlocked: scanCount >= 20,
      unlockedDetail: scanCount >= 20 ? `${scanCount} scans completed` : `${scanCount} of 20 scans completed`,
      criteriaText: 'Scan 20 foods with AI',
      currentCount: scanCount,
      targetCount: 20
    };

    return {
      badges: [vloggerBadge, raterBadge, safetyPioneerBadge],
      foodVloggerUnlocked,
      superiorRaterUnlocked,
      superiorRaterLocked,
      lockReason
    };
  }
};
