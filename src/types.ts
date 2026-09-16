export type AppScreen = 
  | 'splash'
  | 'auth'
  | 'home'
  | 'scanner'
  | 'scanner_result'
  | 'map'
  | 'shop_details'
  | 'review_create'
  | 'videos'
  | 'profile'
  | 'notifications'
  | 'language'
  | 'shopkeeper_dashboard'
  | 'shopkeeper_setup'
  | 'shopkeeper_profile';

export type UserRole = 'user' | 'shopkeeper';

export type ScanType = 'packaged' | 'street';

export interface AnalysisSummaryItem {
  id: string;
  category: string;
  status: 'safe' | 'caution' | 'danger';
  title: string;
  detail: string;
}

export interface FoodScanResult {
  id: string;
  foodName: string;
  foodType: ScanType;
  imageUrl: string;
  scanDate: string;
  safetyScore: number; // 0 - 10
  riskLabel: 'Lower apparent risk' | 'Caution' | 'Higher apparent risk';
  riskColor: 'green' | 'yellow' | 'red';
  summaryItems: AnalysisSummaryItem[];
  recommendation: string;
  disclaimer: string;
  ingredientsOrCleanliness: string[];
  nutritionOrVisualIndicators: Record<string, string>;
}

export interface ShopReview {
  id: string;
  shopId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  reviewText: string;
  likeCount: number;
  date: string;
  userLiked?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  price: string;
  isVeg: boolean;
  category: string;
  imageUrl?: string;
}

export interface FoodShop {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  distance: string;
  distanceMeters: number;
  rating: number;
  isOpen: boolean;
  isPopular?: boolean;
  openingTime: string;
  closingTime: string;
  foodQualityRating: number;
  hygieneRating: number;
  serviceRating: number;
  address: string;
  lat: number;
  lng: number;
  description: string;
  menuCardImage?: string;
  menuItems: MenuItem[];
  reviews: ShopReview[];
}

export interface FoodVideo {
  id: string;
  videoUrl?: string;
  thumbnailUrl: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  foodName: string;
  shopName: string;
  caption: string;
  likes: number;
  isLiked?: boolean;
  commentsCount: number;
  sharesCount: number;
  postedTime: string;
  tags: string[];
}

export interface UserBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedDetail?: string;
  criteriaText: string;
  currentCount: number;
  targetCount: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'badge' | 'like' | 'scan' | 'shop';
  read: boolean;
  badgeType?: 'vlogger' | 'rater';
}

export type SupportedLanguage = 
  | 'en' // English
  | 'hi' // हिन्दी
  | 'mr' // मराठी
  | 'pa' // ਪੰਜਾਬੀ
  | 'te' // తెలుగు
  | 'ta' // தமிழ்
  | 'bn' // বাংলা
  | 'gu'; // ગુજરાતી

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  createdAt: string;
  reviewsCount?: number;
}

export interface ReviewDocument {
  reviewId: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  targetId: string;
  targetType: 'food' | 'shop';
  rating: number;
  subRatings?: Record<string, number>;
  reviewText: string;
  photoUrl?: string;
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
  userReaction?: 'like' | 'dislike' | null;
}

