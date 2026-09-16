import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { AppNotification } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';

const STORAGE_NOTIFICATIONS_KEY = 'foodcheck_local_notifications';

function getLocalNotifications(userId?: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTIFICATIONS_KEY);
    if (raw) {
      const allNotifs = JSON.parse(raw) as AppNotification[];
      if (userId) {
        return allNotifs.filter((n) => !n.userId || n.userId === userId);
      }
      return allNotifs;
    }
  } catch {
    // Ignore
  }

  const initial = INITIAL_NOTIFICATIONS.map((n) => ({
    ...n,
    userId: userId || 'local-default-user'
  }));
  saveLocalNotifications(initial);
  return initial;
}

function saveLocalNotifications(notifications: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch {
    // Ignore
  }
}

export const notificationService = {
  /**
   * Fetch in-app notifications for user
   */
  async getUserNotifications(userId: string): Promise<AppNotification[]> {
    if (!userId) return getLocalNotifications();

    if (isFirebaseConfigured && db) {
      try {
        const notifsRef = collection(db, 'notifications');
        const q = query(
          notifsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs.map((d) => d.data() as AppNotification);
        }
      } catch (err) {
        console.warn('Failed to fetch notifications from Firestore, using local fallback:', err);
      }
    }

    return getLocalNotifications(userId);
  },

  /**
   * Dispatch a new notification
   */
  async sendNotification(params: {
    userId: string;
    title: string;
    body: string;
    type: 'badge' | 'like' | 'scan' | 'shop';
    badgeType?: 'vlogger' | 'rater';
  }): Promise<AppNotification> {
    const notifId = 'n-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const newNotif: AppNotification = {
      id: notifId,
      userId: params.userId,
      title: params.title,
      body: params.body,
      time: 'Just now',
      type: params.type,
      read: false,
      badgeType: params.badgeType,
      createdAt: now
    };

    if (isFirebaseConfigured && db && params.userId) {
      try {
        const notifRef = doc(db, 'notifications', notifId);
        await setDoc(notifRef, newNotif);
        return newNotif;
      } catch (err) {
        console.warn('Failed to write notification to Firestore, saving locally:', err);
      }
    }

    const local = getLocalNotifications();
    const updated = [newNotif, ...local];
    saveLocalNotifications(updated);
    return newNotif;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const local = getLocalNotifications();
    const updated = local.map((n) => (n.userId === userId || !n.userId ? { ...n, read: true } : n));
    saveLocalNotifications(updated);
  }
};
