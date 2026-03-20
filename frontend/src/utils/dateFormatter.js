/**
 * Format dates in GMT -3 (Brasília Time / BRT)
 * All sensor timestamps are displayed in this timezone
 */

/**
 * Format date to GMT -3 (Brasília Time)
 * @param {string|Date} dateInput - Date string or Date object
 * @param {object} options - Formatting options
 * @returns {string} Formatted date in GMT -3
 */
export function formatDateBRT(dateInput, options = {}) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) {
    return 'Data inválida';
  }

  // Convert to GMT -3 (BRT)
  const brtDate = new Date(date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));

  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };

  return brtDate.toLocaleString('pt-BR', { ...defaultOptions, ...options });
}

/**
 * Format date and time in full format (GMT -3)
 * Example: "20/03/2026, 16:34:30"
 */
export function formatFullDateTimeBRT(dateInput) {
  return formatDateBRT(dateInput, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format time only in GMT -3
 * Example: "16:34"
 */
export function formatTimeBRT(dateInput) {
  return formatDateBRT(dateInput, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date only in GMT -3
 * Example: "20/03/2026"
 */
export function formatDateOnlyBRT(dateInput) {
  return formatDateBRT(dateInput, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format relative time (e.g., "há 5 minutos", "há 2 horas")
 */
export function formatRelativeTimeBRT(dateInput) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'agora mesmo';
  } else if (diffMin < 60) {
    return `há ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
  } else if (diffHour < 24) {
    return `há ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
  } else if (diffDay < 7) {
    return `há ${diffDay} dia${diffDay > 1 ? 's' : ''}`;
  } else {
    return formatDateOnlyBRT(date);
  }
}
