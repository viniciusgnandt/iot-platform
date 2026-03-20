// src/hooks/useBackendHealth.js
// Monitor backend availability with automatic reconnection

import { useState, useEffect } from 'react';

export function useBackendHealth() {
  const [isHealthy, setIsHealthy] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let intervalId;

    const checkHealth = async () => {
      setIsChecking(true);
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5s timeout
        });

        setIsHealthy(response.ok);
        setLastChecked(new Date());
      } catch (err) {
        setIsHealthy(false);
        setLastChecked(new Date());
      } finally {
        setIsChecking(false);
      }
    };

    // Check immediately
    checkHealth();

    // Check every 10 seconds
    intervalId = setInterval(checkHealth, 10000);

    return () => clearInterval(intervalId);
  }, []);

  return { isHealthy, lastChecked, isChecking };
}
