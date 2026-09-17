import { FoodScanResult, FoodShop, FoodVideo, UserBadge, AppNotification } from '../types';

// All arrays start empty — real data is loaded from Firestore via the service layer.
// Mock data has been removed for production. These exports remain for backward
// compatibility with imports elsewhere in the codebase.

export const INITIAL_RECENT_SCANS: FoodScanResult[] = [];

export const INITIAL_SHOPS: FoodShop[] = [];

export const INITIAL_VIDEOS: FoodVideo[] = [];

export const INITIAL_BADGES: UserBadge[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
