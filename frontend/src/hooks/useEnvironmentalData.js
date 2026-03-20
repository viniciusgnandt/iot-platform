// src/hooks/useEnvironmentalData.js
// React Query hooks for all API endpoints

import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes - matches backend cache

export function useSensors(params = {}) {
  return useQuery({
    queryKey: ['sensors', params],
    queryFn:  () => api.getSensors(params),
    staleTime: STALE_TIME,
    select: res => res.data,
  });
}

export function useCities(params = {}) {
  return useQuery({
    queryKey: ['cities', params],
    queryFn:  () => api.getCities(params),
    staleTime: STALE_TIME,
    select: res => res.data,
  });
}

export function useRanking(limit = 50) {
  return useQuery({
    queryKey: ['ranking', limit],
    queryFn:  () => api.getRanking(limit),
    // Retry a cada 10s enquanto o backend ainda está carregando (retorna 202)
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.loading === true) return 10_000;
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

export function useICAUD(lat, lon) {
  return useQuery({
    queryKey: ['icaud', lat, lon],
    queryFn:  () => api.getICAUD(lat, lon),
    staleTime: STALE_TIME,
    enabled: lat !== null && lon !== null,
    select: res => res.data,
  });
}
