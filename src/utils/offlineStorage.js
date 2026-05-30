// src/utils/offlineStorage.js
// Offline queue — saves entries locally when no internet, syncs when back online
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'mul-offline-queue';
const CACHE_KEY = 'mul-data-cache';

export const offlineStorage = {
  // Add entry to offline queue
  enqueue: async (action, data) => {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push({ id: Date.now().toString(), action, data, timestamp: new Date().toISOString() });
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) { console.warn('Offline enqueue error:', e); }
  },

  // Get pending queue
  getQueue: async () => {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  // Remove item from queue after sync
  dequeue: async (id) => {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.filter(i => i.id !== id)));
    } catch {}
  },

  // Clear entire queue
  clearQueue: async () => {
    try { await AsyncStorage.removeItem(QUEUE_KEY); } catch {}
  },

  // Cache API response
  cacheData: async (key, data) => {
    try {
      const cache = { data, timestamp: Date.now() };
      await AsyncStorage.setItem(`${CACHE_KEY}-${key}`, JSON.stringify(cache));
    } catch {}
  },

  // Get cached data (maxAge in ms, default 5 min)
  getCached: async (key, maxAge = 5 * 60 * 1000) => {
    try {
      const raw = await AsyncStorage.getItem(`${CACHE_KEY}-${key}`);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > maxAge) return null;
      return data;
    } catch { return null; }
  },
};
