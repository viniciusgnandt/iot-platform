// src/components/ranking/RankingTable.jsx
// City ranking table sorted by ICAU-D score

import { Link } from 'react-router-dom';
import { classify, formatScore, formatMeasurement } from '../../utils/icaud.js';
import { ClassificationBadge } from '../ui/index.jsx';

export default function RankingTable({ cities = [], showDetails = false }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold w-12">#</th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Cidade</th>
            <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">ICAU-D</th>
            <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold hidden sm:table-cell">Status</th>
            {showDetails && (
              <>
                <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold hidden md:table-cell">Temp.</th>
                <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold hidden md:table-cell">Umidade</th>
                <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold hidden lg:table-cell">PM2.5</th>
                <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold hidden lg:table-cell">Vento</th>
              </>
            )}
            <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold hidden sm:table-cell">Sensores</th>
          </tr>
        </thead>
        <tbody>
          {cities.map((city, idx) => {
            const rank  = city.rank ?? idx + 1;
            const score = city.icaud?.score ?? null;
            const cls   = classify(score);
            const m     = city.measurements || {};

            const sensorInfo = city.sensorList && city.sensorList.length > 0
              ? city.sensorList.map(s => `${s.name} (${s.source})`).join('\n')
              : '';

            return (
              <tr
                key={city.id || city.name}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                {/* Rank */}
                <td className="py-3 px-4">
                  <span className={`font-bold font-mono text-base ${rank <= 3 ? 'text-amber-500' : 'text-gray-300'}`}>
                    {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}
                  </span>
                </td>

                {/* City Name */}
                <td className="py-3 px-4">
                  <Link
                    to={`/cities/${encodeURIComponent(city.name)}`}
                    className="font-semibold text-gray-800 hover:text-green-600 transition-colors"
                  >
                    {city.name}
                  </Link>
                  <div className="text-xs text-gray-400 mt-0.5">{city.country || 'Unknown'}</div>
                </td>

                {/* Score */}
                <td className="py-3 px-4 text-center">
                  <span
                    className="font-bold font-mono text-lg"
                    style={{ color: cls?.color || '#9ca3af' }}
                  >
                    {formatScore(score)}
                  </span>
                </td>

                {/* Classification */}
                <td className="py-3 px-4 text-center hidden sm:table-cell">
                  {cls ? (
                    <ClassificationBadge label={cls.label} color={cls.color} />
                  ) : (
                    <span className="text-gray-300 text-xs">N/A</span>
                  )}
                </td>

                {/* Details columns */}
                {showDetails && (
                  <>
                    <td className="py-3 px-4 text-center font-mono text-gray-600 hidden md:table-cell">
                      {formatMeasurement(m.temperature, '°C')}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-gray-600 hidden md:table-cell">
                      {formatMeasurement(m.humidity, '%', 0)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-gray-600 hidden lg:table-cell">
                      {formatMeasurement(m.pm25, 'µg/m³')}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-gray-600 hidden lg:table-cell">
                      {formatMeasurement(m.windSpeed, 'm/s')}
                    </td>
                  </>
                )}

                {/* Sensor count */}
                <td className="py-3 px-4 text-center hidden sm:table-cell">
                  <span
                    title={sensorInfo ? `Sensores:\n${sensorInfo}` : ''}
                    className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 font-mono font-semibold flex items-center justify-center gap-1 inline-flex cursor-help"
                  >
                    📡 {city.sensorCount}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
