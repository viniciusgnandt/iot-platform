// src/utils/icaud.js
// Frontend utilities for ICAU-D display

// Labels are i18n keys — translate with t(`classifications.${label}`) in components
export const CLASSIFICATIONS = [
  { min: 81, max: 100, label: 'Very Comfortable', color: '#22c55e', bg: 'bg-green-500',  text: 'text-green-600',  badge: 'bg-green-100 text-green-800'  },
  { min: 61, max: 80,  label: 'Comfortable',      color: '#84cc16', bg: 'bg-lime-400',   text: 'text-lime-600',   badge: 'bg-lime-100 text-lime-800'    },
  { min: 31, max: 60,  label: 'Uncomfortable',    color: '#f59e0b', bg: 'bg-amber-400',  text: 'text-amber-600',  badge: 'bg-amber-100 text-amber-800'  },
  { min: 0,  max: 30,  label: 'Unhealthy',        color: '#ef4444', bg: 'bg-red-500',    text: 'text-red-600',    badge: 'bg-red-100 text-red-800'      },
];

export function classify(score) {
  if (score === null || score === undefined) return null;
  return CLASSIFICATIONS.find(c => score >= c.min && score <= c.max) || CLASSIFICATIONS[3];
}

export function getMarkerColor(score) {
  if (score === null || score === undefined) return '#6b7280';
  if (score >= 81) return '#22c55e';
  if (score >= 61) return '#84cc16';
  if (score >= 31) return '#f59e0b';
  return '#ef4444';
}

export function formatScore(score) {
  if (score === null || score === undefined) return 'N/A';
  return score.toFixed(1);
}

export function formatMeasurement(value, unit, decimals = 1) {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(decimals)} ${unit}`;
}
