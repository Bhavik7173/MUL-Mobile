// src/hooks/useNetworkStatus.js
import { useState, useEffect, useRef } from 'react';
import { ENV } from '../config/env';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const intervalRef = useRef(null);

  const checkConnectivity = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${ENV.BACKEND_URL}/api/`, { signal: controller.signal });
      clearTimeout(timeout);
      setIsOnline(res.ok);
    } catch {
      setIsOnline(false);
    }
    setLastChecked(new Date());
  };

  useEffect(() => {
    checkConnectivity();
    intervalRef.current = setInterval(checkConnectivity, 15000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return { isOnline, lastChecked, checkConnectivity };
}
