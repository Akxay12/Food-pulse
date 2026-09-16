import { FoodScanResult, FoodShop, FoodVideo, UserBadge, AppNotification } from '../types';

export const INITIAL_RECENT_SCANS: FoodScanResult[] = [
  {
    id: 'scan-1',
    foodName: 'Vada Pav',
    foodType: 'street',
    imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80',
    scanDate: 'Scanned today',
    safetyScore: 7.8,
    riskLabel: 'Lower apparent risk',
    riskColor: 'green',
    summaryItems: [
      { id: '1', category: 'expiry', status: 'safe', title: 'Freshness Indicator', detail: 'Freshly fried batter, steam visible' },
      { id: '2', category: 'packaging', status: 'safe', title: 'Oil Quality', detail: 'Light amber oil appearance, minimal smoking' },
      { id: '3', category: 'ingredients', status: 'caution', title: 'Hygiene Assessment', detail: 'Covered counter, server wearing gloves' },
      { id: '4', category: 'condition', status: 'safe', title: 'Food Condition', detail: 'Normal golden-brown visual appearance' },
      { id: '5', category: 'allergens', status: 'caution', title: 'Allergen Advisory', detail: 'Contains gluten, peanuts in dry chutney' }
    ],
    recommendation: 'This food shows no obvious visual or contamination warning signs based on the imagery analyzed. Chutneys are served fresh and stall surface appears well maintained. Consume warm.',
    disclaimer: 'AI assessment is based on visible/package information and cannot detect hidden contamination or replace laboratory food-safety testing.',
    ingredientsOrCleanliness: ['Fresh potato mash with mustard seeds', 'Chickpea flour coating', 'Pav bread (wheat)', 'Garlic peanut chutney'],
    nutritionOrVisualIndicators: {
      'Visible Freshness': 'High (Prepared within 15 mins)',
      'Estimated Calories': '~280 kcal per piece',
      'Oil Quality Index': 'Grade B (Acceptable visual clarity)',
      'Stall Cleanliness': 'Clean counter & enclosed glass'
    }
  },
  {
    id: 'scan-2',
    foodName: 'Packaged Potato Chips',
    foodType: 'packaged',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
    scanDate: 'Scanned yesterday',
    safetyScore: 8.2,
    riskLabel: 'Lower apparent risk',
    riskColor: 'green',
    summaryItems: [
      { id: '1', category: 'expiry', status: 'safe', title: 'Expiry / Best Before', detail: 'Valid (Best before 18 Dec 2026)' },
      { id: '2', category: 'packaging', status: 'safe', title: 'Packaging Condition', detail: 'Hermetically sealed, nitrogen puff intact' },
      { id: '3', category: 'ingredients', status: 'caution', title: 'Ingredients & Additives', detail: 'Review recommended: Contains palm olein & INS 627, 631' },
      { id: '4', category: 'condition', status: 'safe', title: 'Food Condition', detail: 'No package puncture or leak detected' },
      { id: '5', category: 'allergens', status: 'caution', title: 'Allergen Information', detail: 'Processed in facility handling milk & soy' }
    ],
    recommendation: 'Packaging is factory-intact with clear legible FSSAI license & batch number. Contains moderate sodium and palm oil; recommended as occasional treat.',
    disclaimer: 'AI assessment is based on visible/package information and cannot detect hidden contamination or replace laboratory food-safety testing.',
    ingredientsOrCleanliness: ['Potatoes', 'Edible Vegetable Oil (Palmolein)', 'Salt', 'Spices & Condiments (Chilli, Onion, Garlic powder)'],
    nutritionOrVisualIndicators: {
      'Expiry Date': '18/12/2026 (Valid)',
      'FSSAI Lic': '10014022002711',
      'Sodium': '580mg / 100g (Elevated)',
      'Seal Integrity': '100% Intact'
    }
  },
  {
    id: 'scan-3',
    foodName: 'Fresh Veggie Pizza Slice',
    foodType: 'street',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    scanDate: 'Scanned 3 days ago',
    safetyScore: 6.9,
    riskLabel: 'Caution',
    riskColor: 'yellow',
    summaryItems: [
      { id: '1', category: 'expiry', status: 'caution', title: 'Holding Temperature', detail: 'Visible room temperature display cabinet' },
      { id: '2', category: 'packaging', status: 'safe', title: 'Surface Integrity', detail: 'Melted cheese shows even browning' },
      { id: '3', category: 'ingredients', status: 'caution', title: 'Ingredient Freshness', detail: 'Veggies slightly desiccated around crust' },
      { id: '4', category: 'condition', status: 'safe', title: 'Visual Hygiene', detail: 'Clean serving trays & metal tongs used' },
      { id: '5', category: 'allergens', status: 'danger', title: 'Major Allergens', detail: 'Dairy (Mozzarella), Wheat Gluten' }
    ],
    recommendation: 'Food appears safe to consume if reheated thoroughly to >75°C. Uncovered display time appears elevated; verify heat before eating.',
    disclaimer: 'AI assessment is based on visible/package information and cannot detect hidden contamination or replace laboratory food-safety testing.',
    ingredientsOrCleanliness: ['Wheat dough base', 'Tomato herb sauce', 'Processed mozzarella', 'Bell peppers, red onion, corn'],
    nutritionOrVisualIndicators: {
      'Freshness State': 'Baked earlier today',
      'Estimated Calories': '~260 kcal / slice',
      'Hygiene Assessment': 'Acceptable visual standards'
    }
  }
];

export const INITIAL_SHOPS: FoodShop[] = [
  {
    id: 'shop-1',
    name: 'Shree Snacks & Sweets',
    category: 'Mumbai Street Food & Chaat',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    distance: '0.4 km',
    distanceMeters: 400,
    rating: 4.6,
    isOpen: true,
    isPopular: true,
    openingTime: '07:30 AM',
    closingTime: '10:30 PM',
    foodQualityRating: 4.7,
    hygieneRating: 4.5,
    serviceRating: 4.4,
    address: 'Shop 4, MG Road, near Central Station, Dadar',
    lat: 19.0178,
    lng: 72.8478,
    description: 'Renowned local eatery famous for crispy hot Vada Pav, fresh Misal, and hygienically prepared samosas. Certified clean oil and daily fresh ingredients.',
    menuCardImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    menuItems: [
      { id: 'm1', name: 'Special Jumbo Vada Pav', price: '₹22', isVeg: true, category: 'Fast Food' },
      { id: 'm2', name: 'Kolhapuri Kat Misal Pav', price: '₹75', isVeg: true, category: 'Breakfast' },
      { id: 'm3', name: 'Kanda Bhaji (Onion Pakoda)', price: '₹40', isVeg: true, category: 'Snacks' },
      { id: 'm4', name: 'Ginger Masala Chai', price: '₹15', isVeg: true, category: 'Beverages' }
    ],
    reviews: [
      {
        id: 'r1',
        shopId: 'shop-1',
        userName: 'Rahul Sharma',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        reviewText: 'Food was fresh and the stall was impeccably clean. Hot vada served straight out of filtered groundnut oil. A must-try!',
        likeCount: 126,
        date: '2 days ago',
        userLiked: false
      },
      {
        id: 'r2',
        shopId: 'shop-1',
        userName: 'Pooja Deshmukh',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        rating: 4,
        reviewText: 'Very hygienic counter and stainless steel preparation area. Staff wear caps and gloves.',
        likeCount: 42,
        date: '1 week ago',
        userLiked: false
      }
    ]
  },
  {
    id: 'shop-2',
    name: 'Food Corner Fast Food',
    category: 'Indo-Chinese & Rolls',
    imageUrl: 'https://images.unsplash.com/photo-1561719536-545214b75eb7?w=600&auto=format&fit=crop&q=80',
    distance: '0.8 km',
    distanceMeters: 800,
    rating: 4.3,
    isOpen: true,
    isPopular: false,
    openingTime: '11:00 AM',
    closingTime: '11:30 PM',
    foodQualityRating: 4.4,
    hygieneRating: 4.1,
    serviceRating: 4.3,
    address: 'Corner 12, Station Road, Opp. City College',
    lat: 19.0215,
    lng: 72.8521,
    description: 'Favorite student hub for Schezwan noodles, paneer frankies, and crispy spring rolls. Fast service and open-flame wok cooking.',
    menuItems: [
      { id: 'm5', name: 'Paneer Tikka Frankie', price: '₹90', isVeg: true, category: 'Rolls' },
      { id: 'm6', name: 'Veg Hakka Noodles', price: '₹120', isVeg: true, category: 'Chinese' },
      { id: 'm7', name: 'Crispy Veg Manchurian Dry', price: '₹130', isVeg: true, category: 'Chinese' }
    ],
    reviews: [
      {
        id: 'r3',
        shopId: 'shop-2',
        userName: 'Aditya K.',
        userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        rating: 4,
        reviewText: 'High flame fresh cooking right in front of you. Safe and tasty!',
        likeCount: 31,
        date: '3 days ago',
        userLiked: false
      }
    ]
  },
  {
    id: 'shop-3',
    name: 'Taste Hub South Indian Cafe',
    category: 'South Indian & Filter Coffee',
    imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
    distance: '1.2 km',
    distanceMeters: 1200,
    rating: 4.7,
    isOpen: true,
    isPopular: true,
    openingTime: '06:30 AM',
    closingTime: '09:30 PM',
    foodQualityRating: 4.8,
    hygieneRating: 4.7,
    serviceRating: 4.6,
    address: 'Plot 88, Heritage Lane, Matunga Circle',
    lat: 19.0264,
    lng: 72.8569,
    description: 'Authentic fermented dosa batters, stone-ground coconut chutneys, and aromatic piping hot Madras filter coffee. Grade-A hygiene certified.',
    menuItems: [
      { id: 'm8', name: 'Butter Masala Dosa', price: '₹85', isVeg: true, category: 'South Indian' },
      { id: 'm9', name: 'Steamed Idli Sambar (2 pcs)', price: '₹55', isVeg: true, category: 'South Indian' },
      { id: 'm10', name: 'Madras Filter Coffee', price: '₹30', isVeg: true, category: 'Beverages' }
    ],
    reviews: [
      {
        id: 'r4',
        shopId: 'shop-3',
        userName: 'Sneha Nair',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        reviewText: 'Super hygienic! The coconut chutney is made fresh every 2 hours in refrigerated dispensers.',
        likeCount: 88,
        date: 'Yesterday',
        userLiked: false
      }
    ]
  },
  {
    id: 'shop-4',
    name: 'Spice Villa Chaat Junction',
    category: 'North Indian Chaats',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    distance: '2.1 km',
    distanceMeters: 2100,
    rating: 4.1,
    isOpen: false,
    isPopular: false,
    openingTime: '04:00 PM',
    closingTime: '11:00 PM',
    foodQualityRating: 4.2,
    hygieneRating: 3.9,
    serviceRating: 4.0,
    address: 'Gala 3, Sector 9 Market',
    lat: 19.0345,
    lng: 72.8640,
    description: 'Pani Puri with RO mineral water, Sev Puri, and Dahi Bhalla made with chilled fresh curd.',
    menuItems: [
      { id: 'm11', name: 'Mineral Water Pani Puri (6 pcs)', price: '₹40', isVeg: true, category: 'Chaat' },
      { id: 'm12', name: 'Special Dahi Puri', price: '₹60', isVeg: true, category: 'Chaat' }
    ],
    reviews: []
  }
];

export const INITIAL_VIDEOS: FoodVideo[] = [
  {
    id: 'v1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80',
    authorName: 'Rahul Sharma',
    authorUsername: '@foodie_rahul',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    foodName: 'Jumbo Vada Pav with Lasun Chutney 🌮',
    shopName: 'Shree Snacks',
    caption: 'Street Food Hunt 🌮! Found this amazing street food near college! Fresh oil check passed on FoodCheck with 7.8/10 score!',
    likes: 1420,
    isLiked: false,
    commentsCount: 88,
    sharesCount: 310,
    postedTime: '2 hours ago',
    tags: ['StreetFood', 'FoodCheckSafe', 'MumbaiFoodie']
  },
  {
    id: 'v2',
    thumbnailUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
    authorName: 'Priya Mehta',
    authorUsername: '@priyabites',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    foodName: 'Crispy Butter Masala Dosa 🥞',
    shopName: 'Taste Hub',
    caption: 'Morning breakfast done right! Stone-ground batter and spotless stainless steel kitchen! 4.7 Hygiene rating on FoodCheck ⭐',
    likes: 890,
    isLiked: true,
    commentsCount: 42,
    sharesCount: 145,
    postedTime: '5 hours ago',
    tags: ['SouthIndian', 'BreakfastLove', 'HealthyEats']
  },
  {
    id: 'v3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    authorName: 'Harshal Lad',
    authorUsername: '@harshal',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    foodName: 'Mineral Water Pani Puri Testing 💧',
    shopName: 'Spice Villa Chaat',
    caption: 'Testing street food hygiene with our AI scanner! RO water dispenser verified. Safe to eat with buddies!',
    likes: 540,
    isLiked: true,
    commentsCount: 63,
    sharesCount: 92,
    postedTime: '1 day ago',
    tags: ['PaniPuri', 'HygieneCheck', 'FoodCheckApp']
  }
];

export const INITIAL_BADGES: UserBadge[] = [
  {
    id: 'vlogger',
    title: 'Food Vlogger',
    description: 'Shared more than 5 food discovery videos with the FoodCheck community.',
    icon: '🏅',
    isUnlocked: true,
    unlockedDetail: '7 food videos shared',
    criteriaText: 'Upload 5+ food videos',
    currentCount: 7,
    targetCount: 5
  },
  {
    id: 'rater',
    title: 'Superior Rater',
    description: 'Your food reviews and ratings received 100+ helpful likes from community members.',
    icon: '⭐',
    isUnlocked: true,
    unlockedDetail: '143 helpful likes received',
    criteriaText: 'Receive 100+ helpful review likes',
    currentCount: 143,
    targetCount: 100
  },
  {
    id: 'scanner_pro',
    title: 'Safety Pioneer',
    description: 'Conducted 20+ AI safety scans helping map hygiene trends across town.',
    icon: '🛡️',
    isUnlocked: false,
    unlockedDetail: '14 of 20 scans completed',
    criteriaText: 'Scan 20 foods with AI',
    currentCount: 14,
    targetCount: 20
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Superior Rater badge unlocked ⭐',
    body: 'Congratulations! Your community reviews crossed 100 helpful likes. Badge is now visible on your public profile.',
    time: '10m ago',
    type: 'badge',
    read: false,
    badgeType: 'rater'
  },
  {
    id: 'n2',
    title: 'Your review received 100 likes 🎉',
    body: '126 foodies found your review on Shree Snacks helpful today.',
    time: '2h ago',
    type: 'like',
    read: false
  },
  {
    id: 'n3',
    title: 'Food Vlogger badge unlocked 🏅',
    body: 'You have shared 7 food videos! You are an official community Food Vlogger.',
    time: '1d ago',
    type: 'badge',
    read: true,
    badgeType: 'vlogger'
  },
  {
    id: 'n4',
    title: 'Your food scan is ready',
    body: 'Vada Pav safety score calculated: 7.8/10 (Lower apparent risk).',
    time: '2d ago',
    type: 'scan',
    read: true
  },
  {
    id: 'n5',
    title: 'New shop added near you',
    body: 'Shree Snacks published a new menu item: Special Kolhapuri Misal.',
    time: '3d ago',
    type: 'shop',
    read: true
  }
];
