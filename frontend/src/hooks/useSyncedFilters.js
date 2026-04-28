// src/hooks/useSyncedFilters.js
// Hook que sincroniza filtros de continente/país/classificação/fonte com a URL
// (querystring), de modo que ao navegar entre Painel → Ranking → Mapa o usuário
// preserve o que tinha selecionado.

import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

const FILTER_KEYS = ['continent', 'country', 'class', 'source'];

export function useSyncedFilters() {
  const [params, setParams] = useSearchParams();

  const filters = {
    continent: params.get('continent') || '',
    country:   params.get('country')   || '',
    class:     params.get('class')     || '',
    source:    params.get('source')    || '',
  };

  const update = useCallback((patch) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (FILTER_KEYS.includes(k)) {
          if (v) next.set(k, v); else next.delete(k);
        }
      }
      return next;
    }, { replace: true });
  }, [setParams]);

  const clear = useCallback(() => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      FILTER_KEYS.forEach(k => next.delete(k));
      return next;
    }, { replace: true });
  }, [setParams]);

  const hasActive = Boolean(filters.continent || filters.country || filters.class || filters.source);

  return { filters, update, clear, hasActive };
}
