// src/hooks/useBackendHealth.js
// Monitor backend availability with automatic reconnection

import { useState, useEffect } from 'react';

export function useBackendHealth() {
  const [isHealthy, setIsHealthy] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  // `isChecking` só é true ANTES do primeiro check. Polls subsequentes não
  // setam isso de volta — caso contrário o banner "Conectando..." piscaria
  // a cada 10s mesmo com o backend funcionando perfeitamente.
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let intervalId;
    let firstCheckDone = false;

    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        setIsHealthy(response.ok);
      } catch (err) {
        setIsHealthy(false);
      } finally {
        setLastChecked(new Date());
        if (!firstCheckDone) {
          firstCheckDone = true;
          setIsChecking(false);
        }
      }
    };

    checkHealth();
    intervalId = setInterval(checkHealth, 60_000); // poll a cada 60s

    return () => clearInterval(intervalId);
  }, []);

  return { isHealthy, lastChecked, isChecking };
}
