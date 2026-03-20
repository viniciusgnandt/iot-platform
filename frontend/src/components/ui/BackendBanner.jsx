// src/components/ui/BackendBanner.jsx
// Display warning when backend is unavailable

export function BackendBanner({ isHealthy, isChecking }) {
  if (isHealthy && !isChecking) {
    return null;
  }

  return (
    <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-3 text-sm flex items-center gap-2">
      <div className="animate-pulse text-lg">⚠️</div>
      <div className="flex-1">
        {isChecking ? (
          <span>Conectando ao backend...</span>
        ) : (
          <span>
            <strong>Backend indisponível</strong> — dados em tempo real desabilitados.
            Certifique-se de que o backend está rodando:
            <code className="ml-2 bg-red-100 px-2 py-1 rounded text-xs font-mono">
              cd backend && npm run dev
            </code>
          </span>
        )}
      </div>
    </div>
  );
}
