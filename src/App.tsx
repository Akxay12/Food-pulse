import React, { useState, useEffect } from 'react';
import { MobileFrame } from './components/common/MobileFrame';
import { BottomNav } from './components/common/BottomNav';
import { SplashScreen } from './components/screens/SplashScreen';
import { AuthScreen } from './components/screens/AuthScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { ScannerScreen } from './components/screens/ScannerScreen';
import { ResultScreen } from './components/screens/ResultScreen';
import { MapScreen } from './components/screens/MapScreen';
import { ShopDetailsScreen } from './components/screens/ShopDetailsScreen';
import { UserReviewScreen } from './components/screens/UserReviewScreen';
import { VideosScreen } from './components/screens/VideosScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { NotificationsScreen } from './components/screens/NotificationsScreen';
import { LanguageScreen } from './components/screens/LanguageScreen';
import { ShopkeeperDashboard } from './components/screens/ShopkeeperDashboard';
import { SetupShopScreen } from './components/screens/SetupShopScreen';
import { ShopkeeperProfileScreen } from './components/screens/ShopkeeperProfileScreen';

import {
  AppScreen,
  UserRole,
  FoodScanResult,
  FoodShop,
  FoodVideo,
  UserBadge,
  AppNotification,
  SupportedLanguage
} from './types';

import {
  INITIAL_RECENT_SCANS,
  INITIAL_SHOPS,
  INITIAL_VIDEOS,
  INITIAL_BADGES,
  INITIAL_NOTIFICATIONS
} from './data/mockData';

import { TRANSLATIONS } from './utils/translations';
import { authService } from './services/authService';
import { reviewService } from './services/reviewService';

export default function App() {
  // Screen and Role State
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Authenticated User State (Module 1E & 1F)
  const [user, setUser] = useState({
    uid: 'local-default-user',
    name: 'Harshal Lad',
    username: '@harshal',
    email: 'harshallad2007@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    reviewsCount: 24,
    videosCount: 7,
    likesCount: 143,
  });

  // App Data State (Realistic, durable state with in-memory reactivity)
  const [recentScans, setRecentScans] = useState<FoodScanResult[]>(INITIAL_RECENT_SCANS);
  const [activeScanResult, setActiveScanResult] = useState<FoodScanResult>(INITIAL_RECENT_SCANS[0]);
  const [shops, setShops] = useState<FoodShop[]>(INITIAL_SHOPS);
  const [activeShop, setActiveShop] = useState<FoodShop>(INITIAL_SHOPS[0]);
  const [videos, setVideos] = useState<FoodVideo[]>(INITIAL_VIDEOS);
  const [badges, setBadges] = useState<UserBadge[]>(INITIAL_BADGES);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Translation helper dictionary for current language
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Session Management: Check Firebase Authentication state on startup (Module 1E)
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (authProfile) => {
      if (authProfile) {
        setIsAuthenticated(true);
        setUserRole(authProfile.role || 'user');

        const liveReviewsCount = await reviewService.getUserReviewCount(authProfile.uid);
        setUser((prev) => ({
          ...prev,
          uid: authProfile.uid,
          name: authProfile.name,
          email: authProfile.email,
          username: authProfile.email ? `@${authProfile.email.split('@')[0]}` : '@user',
          avatarUrl: authProfile.profileImage || prev.avatarUrl,
          reviewsCount: liveReviewsCount > 0 ? liveReviewsCount : prev.reviewsCount
        }));
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Handlers
  const handleSplashFinish = () => {
    // If user is already logged in, navigate straight to role-based dashboard; otherwise show auth (Module 1E & 1D)
    if (isAuthenticated) {
      setCurrentScreen(userRole === 'shopkeeper' ? 'shopkeeper_dashboard' : 'home');
    } else {
      setCurrentScreen('auth');
    }
  };

  const handleLoginSuccess = async (role: UserRole, details?: { name: string; email: string }) => {
    setIsAuthenticated(true);
    setUserRole(role);
    if (details) {
      setUser((prev) => ({
        ...prev,
        name: details.name,
        email: details.email,
        username: details.name.toLowerCase().replace(/\s+/g, '_')
      }));
    }
    setCurrentScreen(role === 'shopkeeper' ? 'shopkeeper_dashboard' : 'home');
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setCurrentScreen('auth');
  };

  const handleContinueAsGuest = () => {
    setUserRole('user');
    setIsAuthenticated(false);
    setCurrentScreen('home');
  };

  const handleOpenScanner = () => {
    setCurrentScreen('scanner');
  };

  const handleScanComplete = (result: FoodScanResult) => {
    setActiveScanResult(result);
    // Add to recent scans list
    setRecentScans((prev) => [result, ...prev.filter((r) => r.id !== result.id)]);
    setCurrentScreen('scanner_result');

    // Add a notification
    const newNotif: AppNotification = {
      id: 'n-' + Date.now(),
      title: 'Your food scan is ready',
      body: `${result.foodName} safety score: ${result.safetyScore}/10 (${result.riskLabel})`,
      time: 'Just now',
      type: 'scan',
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleSelectScanResult = (scan: FoodScanResult) => {
    setActiveScanResult(scan);
    setCurrentScreen('scanner_result');
  };

  const handleSelectShop = (shop: FoodShop) => {
    setActiveShop(shop);
    setCurrentScreen('shop_details');
  };

  const handleToggleLikeReview = (shopId: string, reviewId: string) => {
    setShops((prevShops) =>
      prevShops.map((shop) => {
        if (shop.id !== shopId) return shop;
        return {
          ...shop,
          reviews: shop.reviews.map((rev) => {
            if (rev.id !== reviewId) return rev;
            const userLiked = !rev.userLiked;
            return {
              ...rev,
              userLiked,
              likeCount: userLiked ? rev.likeCount + 1 : rev.likeCount - 1
            };
          })
        };
      })
    );
  };

  const handleSubmitReview = async (data: {
    targetType: 'food' | 'shop';
    shopId: string;
    rating: number;
    subRatings: Record<string, number>;
    reviewText: string;
    photoUrl?: string;
  }) => {
    // Save review to Firestore (Module 1H & 1I)
    const saved = await reviewService.createReview({
      userId: user.uid,
      userName: user.name,
      userProfileImage: user.avatarUrl,
      targetId: data.shopId,
      targetType: data.targetType,
      rating: data.rating,
      subRatings: data.subRatings,
      reviewText: data.reviewText,
      photoUrl: data.photoUrl
    });

    const newReview = {
      id: saved.reviewId,
      shopId: data.shopId,
      userName: saved.userName,
      userAvatar: saved.userProfileImage || user.avatarUrl,
      rating: saved.rating,
      reviewText: saved.reviewText,
      likeCount: saved.likesCount,
      date: 'Just now',
      userLiked: false
    };

    setShops((prevShops) =>
      prevShops.map((s) => {
        if (s.id !== data.shopId) return s;
        return {
          ...s,
          reviews: [newReview, ...s.reviews]
        };
      })
    );

    setUser((prev) => ({
      ...prev,
      reviewsCount: prev.reviewsCount + 1
    }));

    // Return to shop details
    const targetShop = shops.find((s) => s.id === data.shopId) || shops[0];
    setActiveShop({
      ...targetShop,
      reviews: [newReview, ...targetShop.reviews]
    });

    // Smooth return after brief success feedback
    setTimeout(() => {
      setCurrentScreen('shop_details');
    }, 450);
  };

  const handleToggleLikeVideo = (videoId: string) => {
    setVideos((prevVideos) =>
      prevVideos.map((v) => {
        if (v.id !== videoId) return v;
        const isLiked = !v.isLiked;
        return {
          ...v,
          isLiked,
          likes: isLiked ? v.likes + 1 : v.likes - 1
        };
      })
    );
  };

  const handleUploadVideo = (videoData: Partial<FoodVideo>) => {
    const newVideo: FoodVideo = {
      id: 'v-' + Date.now(),
      thumbnailUrl: videoData.thumbnailUrl || 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80',
      authorName: user.name,
      authorUsername: user.username,
      authorAvatar: user.avatarUrl,
      foodName: videoData.foodName || 'Delicious Street Dish',
      shopName: videoData.shopName || 'Nearby Stall',
      caption: videoData.caption || 'Checked food freshness on FoodCheck!',
      likes: 1,
      isLiked: true,
      commentsCount: 0,
      sharesCount: 0,
      postedTime: 'Just now',
      tags: ['FoodCheck', 'StreetFood']
    };

    const nextCount = user.videosCount + 1;
    setUser((prev) => ({ ...prev, videosCount: nextCount }));
    setVideos((prev) => [newVideo, ...prev]);

    // Check Food Vlogger Badge condition (> 5 videos)
    if (nextCount > 5) {
      setBadges((prevBadges) =>
        prevBadges.map((b) =>
          b.id === 'vlogger'
            ? { ...b, isUnlocked: true, currentCount: nextCount, unlockedDetail: `${nextCount} food videos shared` }
            : b
        )
      );

      const notif: AppNotification = {
        id: 'n-vlog-' + Date.now(),
        title: 'Food Vlogger badge unlocked 🏅',
        body: `You have shared ${nextCount} food discovery videos!`,
        time: 'Just now',
        type: 'badge',
        read: false,
        badgeType: 'vlogger'
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  const handlePublishShop = (newShop: FoodShop) => {
    setShops((prev) => [newShop, ...prev]);
    setActiveShop(newShop);
    // User Journey: Shop published -> appears on shared FoodCheck map
    setCurrentScreen('map');

    const notif: AppNotification = {
      id: 'n-shop-' + Date.now(),
      title: 'Stall Published to Shared Map',
      body: `"${newShop.name}" is now live for all nearby food lovers.`,
      time: 'Just now',
      type: 'shop',
      read: false
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleToggleShopStatus = () => {
    setShops((prevShops) =>
      prevShops.map((s, idx) => (idx === 0 ? { ...s, isOpen: !s.isOpen } : s))
    );
  };

  const handleUpdateShop = (updatedShop: FoodShop) => {
    setShops((prev) => prev.map((s) => (s.id === updatedShop.id ? updatedShop : s)));
    setActiveShop(updatedShop);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Decide if bottom navigation should appear
  // Main tabs: home, map, videos, profile
  const isMainTabScreen = ['home', 'map', 'videos', 'profile'].includes(currentScreen);

  return (
    <MobileFrame activeScreen={currentScreen}>
      {/* 1. Splash Screen */}
      {currentScreen === 'splash' && (
        <SplashScreen
          onFinish={handleSplashFinish}
          taglineText={t.tagline || 'Check it. Know it. Eat smarter.'}
        />
      )}

      {/* 2. Auth Screen */}
      {currentScreen === 'auth' && (
        <AuthScreen
          onLoginSuccess={handleLoginSuccess}
          onContinueAsGuest={handleContinueAsGuest}
        />
      )}

      {/* 3. Home Screen */}
      {currentScreen === 'home' && (
        <HomeScreen
          userName={user.name.split(' ')[0]}
          userAvatar={user.avatarUrl}
          unreadNotificationsCount={unreadNotificationsCount}
          recentScans={recentScans}
          nearbyShops={shops}
          onOpenScanner={handleOpenScanner}
          onSelectScanResult={handleSelectScanResult}
          onSelectShop={handleSelectShop}
          onNavigate={(screen) => setCurrentScreen(screen)}
          t={t}
        />
      )}

      {/* 4. AI Food Scanner Screen */}
      {currentScreen === 'scanner' && (
        <ScannerScreen
          onBack={() => setCurrentScreen('home')}
          onAnalysisComplete={handleScanComplete}
          t={t}
        />
      )}

      {/* 5. AI Result Screen */}
      {currentScreen === 'scanner_result' && (
        <ResultScreen
          scanResult={activeScanResult}
          onBack={() => setCurrentScreen('home')}
          onScanAnother={handleOpenScanner}
          onSaveResult={(saved) => {
            setRecentScans((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
          }}
          t={t}
        />
      )}

      {/* 6. Map Screen */}
      {currentScreen === 'map' && (
        <MapScreen
          shops={shops}
          onSelectShop={handleSelectShop}
          onOpenShopkeeperSetup={() => setCurrentScreen('shopkeeper_setup')}
          t={t}
        />
      )}

      {/* 7. Shop Details Screen */}
      {currentScreen === 'shop_details' && (
        <ShopDetailsScreen
          shop={activeShop}
          currentUserId={user.uid}
          onBack={() => setCurrentScreen('home')}
          onWriteReview={(shopId) => setCurrentScreen('review_create')}
          onToggleLikeReview={handleToggleLikeReview}
        />
      )}

      {/* 8. User Review Screen */}
      {currentScreen === 'review_create' && (
        <UserReviewScreen
          shops={shops}
          initialShopId={activeShop.id}
          onBack={() => setCurrentScreen('shop_details')}
          onSubmitReview={handleSubmitReview}
        />
      )}

      {/* 9. Videos / Food Vlogger Screen */}
      {currentScreen === 'videos' && (
        <VideosScreen
          videos={videos}
          onToggleLikeVideo={handleToggleLikeVideo}
          onUploadVideo={handleUploadVideo}
          userVideoCount={user.videosCount}
        />
      )}

      {/* 12. User Profile Screen (Module 1F) */}
      {currentScreen === 'profile' && (
        <ProfileScreen
          name={user.name}
          username={user.username}
          email={user.email}
          role={userRole}
          avatarUrl={user.avatarUrl}
          badges={badges}
          reviewsCount={user.reviewsCount}
          videosCount={user.videosCount}
          likesCount={user.likesCount}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onSwitchRole={() => {
            setUserRole('shopkeeper');
            setCurrentScreen('shopkeeper_dashboard');
          }}
          onLogout={handleLogout}
          recentScans={recentScans}
          videos={videos}
        />
      )}

      {/* 14. Shopkeeper Dashboard (Module 1G) */}
      {currentScreen === 'shopkeeper_dashboard' && (
        <ShopkeeperDashboard
          currentShop={shops[0] || null}
          shopkeeperName={user.name}
          shopkeeperEmail={user.email}
          role={userRole}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onToggleShopStatus={handleToggleShopStatus}
          onSwitchToUser={() => {
            setUserRole('user');
            setCurrentScreen('home');
          }}
        />
      )}

      {/* 15. Setup Shop Screen */}
      {currentScreen === 'shopkeeper_setup' && (
        <SetupShopScreen
          onBack={() => setCurrentScreen(userRole === 'shopkeeper' ? 'shopkeeper_dashboard' : 'map')}
          onPublishShop={handlePublishShop}
        />
      )}

      {/* 16. Shopkeeper Shop Profile Screen */}
      {currentScreen === 'shopkeeper_profile' && (
        <ShopkeeperProfileScreen
          shop={shops[0]}
          onBack={() => setCurrentScreen('shopkeeper_dashboard')}
          onUpdateShop={handleUpdateShop}
        />
      )}

      {/* 17. Language Screen */}
      {currentScreen === 'language' && (
        <LanguageScreen
          currentLanguage={language}
          onSelectLanguage={(lang) => {
            setLanguage(lang);
            setCurrentScreen('profile');
          }}
          onBack={() => setCurrentScreen('profile')}
        />
      )}

      {/* 18. Notification Screen */}
      {currentScreen === 'notifications' && (
        <NotificationsScreen
          notifications={notifications}
          onBack={() => setCurrentScreen('home')}
          onMarkAllRead={handleMarkAllRead}
        />
      )}

      {/* Bottom Navigation Bar (Shown on core mobile screens) */}
      {isMainTabScreen && (
        <BottomNav
          activeScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen)}
          langNavMap={{
            home: t.navHome || 'Home',
            map: t.navMap || 'Map',
            videos: t.navVideos || 'Videos',
            profile: t.navProfile || 'Profile',
          }}
        />
      )}
    </MobileFrame>
  );
}
