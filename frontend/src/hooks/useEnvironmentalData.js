// src/hooks/useEnvironmentalData.js
// React Query hooks for all API endpoints

import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';

const STALE_TIME = 55 * 60 * 1000; // 55 min — just under the 1h backend cache TTL

export function useSensors(params = {}) {
  return useQuery({
    queryKey: ['sensors', params],
    queryFn:  () => api.getSensors(params),
    staleTime: STALE_TIME,
    // Retry every 30s while backend is still warming up (returns empty array)
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.count === 0) return 30_000;
      return false;
    },
    select: res => res.data,
  });
}

export function useCities(params = {}) {
  return useQuery({
    queryKey: ['cities', params],
    queryFn:  () => api.getCities(params),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.count === 0) return 30_000;
      return false;
    },
    staleTime: STALE_TIME,
    select: res => res.data,
  });
}

export function useRanking(limit = 50) {
  return useQuery({
    queryKey: ['ranking', limit],
    queryFn:  () => api.getRanking(limit),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.loading === true || data.count === 0) return 30_000;
      return false;
    },
    staleTime: STALE_TIME,
    select: res => res,
  });
}

export function useCity(name) {
  return useQuery({
    queryKey: ['city', name],
    queryFn:  () => api.getCity(name),
    staleTime: STALE_TIME,
    enabled: Boolean(name),
    select: res => res.data,
  });
}

export function useSensorsHistory(period) {
  return useQuery({
    queryKey: ['sensors-history', period],
    queryFn:  () => api.getSensorsHistory(period),
    staleTime: STALE_TIME,
    // Always fetch history — used as fallback when live is empty
    enabled: period === 'week' || period === 'month',
    select: res => res.data,
  });
}

/**
 * Always-on historical fallback:
 * fetches 7-day history from MongoDB — available even when live APIs are down.
 */
export function useSensorsHistoryFallback() {
  return useQuery({
    queryKey: ['sensors-history-fallback'],
    queryFn:  () => api.getSensorsHistory('week'),
    staleTime: STALE_TIME,
    select: res => res.data ?? [],
  });
}

export function useICAUD(lat, lon) {
  return useQuery({
    queryKey: ['icaud', lat, lon],
    queryFn:  () => api.getICAUD(lat, lon),
    staleTime: STALE_TIME,
    enabled: lat !== null && lon !== null,
    select: res => res.data,
  });
}
