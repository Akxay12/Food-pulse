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
  | 'shopkeeper_profile'
  | 'firebase_test';


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
  userId?: string;
  foodName: string; // Detected food name (e.g. "Cheese")
  foodType: ScanType; // 'packaged' | 'street'
  foodTypeLabel?: string; // Visible category/type (e.g. "Dairy Product (Cheddar / processed)")
  imageUrl: string;
  scanDate: string;
  safetyScore: number; // 0 - 10 clamped
  confidence: number; // 0.0 - 1.0 (e.g. 0.86 = 86%)
  visibleConcerns: string[];
  positiveIndicators: string[];
  explanation: string; // Why this score?
  expiryText?: string | null;
  allergens?: string[];
  riskLabel: 'Lower apparent risk' | 'Caution' | 'Higher apparent risk';
  riskColor: 'green' | 'yellow' | 'red';
  summaryItems: AnalysisSummaryItem[];
  recommendation: string;
  disclaimer: string;
  expiryDetected?: boolean;
  detectedExpiryDate?: string;
  ingredientsOrCleanliness: string[];
  nutritionOrVisualIndicators: Record<string, string>;
  createdAt?: string;
}

export interface FoodScanDocument extends FoodScanResult {
  scanId: string;
  userId: string;
}

export interface ShopReview {
  id: string;
  shopId: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  rating: number;
  subRatings?: Record<string, number>;
  reviewText: string;
  likeCount: number;
  dislikeCount?: number;
  date: string;
  userLiked?: boolean;
  userDisliked?: boolean;
  createdAt?: string;
  photoUrl?: string;
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
  ownerId?: string;
  name: string;
  category: string;
  imageUrl: string;
  distance: string;
  distanceMeters: number;
  rating: number;
  isOpen: boolean;
  isPublished?: boolean;
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
  reviewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShopDocument {
  shopId: string;
  ownerId: string;
  shopName: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  shopImage: string;
  menuImage?: string;
  isPublished: boolean;
  isOpen: boolean;
  rating: number;
  reviewsCount?: number;
  foodQualityRating: number;
  hygieneRating: number;
  serviceRating: number;
  address: string;
  menuItems: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

export interface FoodVideo {
  id: string;
  userId?: string;
  videoUrl?: string;
  thumbnailUrl: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  foodName: string;
  shopName: string;
  shopId?: string;
  caption: string;
  likes: number;
  isLiked?: boolean;
  commentsCount: number;
  sharesCount: number;
  postedTime: string;
  tags: string[];
  createdAt?: string;
}

export interface VideoDocument {
  videoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  videoUrl?: string;
  thumbnailUrl: string;
  foodName: string;
  caption: string;
  shopId?: string;
  shopName?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
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
  isLockedDueToCondition?: boolean;
  lockExplanation?: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  body: string;
  time: string;
  type: 'badge' | 'like' | 'scan' | 'shop';
  read: boolean;
  badgeType?: 'vlogger' | 'rater';
  createdAt?: string;
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
  videosCount?: number;
  helpfulLikesReceived?: number;
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
