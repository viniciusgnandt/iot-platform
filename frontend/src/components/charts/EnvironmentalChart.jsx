// src/components/charts/EnvironmentalChart.jsx
// Chart.js visualizations for environmental data

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler, ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { CLASSIFICATIONS } from '../../utils/icaud.js';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler, ArcElement
);

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { font: { family: 'Space Grotesk', size: 12 } } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'JetBrains Mono', size: 11 } } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { family: 'JetBrains Mono', size: 11 } } },
  },
};

/**
 * Top cities bar chart by ICAU-D score
 */
export function TopCitiesChart({ cities = [] }) {
  const top10 = cities.slice(0, 10);

  const data = {
    labels: top10.map(c => c.name),
    datasets: [{
      label: 'ICAU-D Score',
      data:  top10.map(c => c.icaud?.score ?? 0),
      backgroundColor: top10.map(c => {
        const score = c.icaud?.score ?? 0;
        if (score >= 81) return '#22c55e';
        if (score >= 61) return '#84cc16';
        if (score >= 31) return '#f59e0b';
        return '#ef4444';
      }),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  return (
    <div style={{ height: 300 }}>
      <Bar data={data} options={{
        ...defaultOptions,
        plugins: {
          ...defaultOptions.plugins,
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `Score: ${ctx.parsed.y.toFixed(1)}`,
            },
          },
        },
        scales: {
          ...defaultOptions.scales,
          y: { ...defaultOptions.scales.y, min: 0, max: 100 },
        },
      }} />
    </div>
  );
}

/**
 * Distribution donut chart by classification
 */
export function ClassificationDonut({ cities = [] }) {
  const counts = CLASSIFICATIONS.map(cls =>
    cities.filter(c => {
      const s = c.icaud?.score ?? -1;
      return s >= cls.min && s <= cls.max;
    }).length
  );

  const data = {
    labels: CLASSIFICATIONS.map(c => c.label),
    datasets: [{
      data: counts,
      backgroundColor: CLASSIFICATIONS.map(c => c.color),
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  };

  return (
    <div style={{ height: 260 }}>
      <Doughnut data={data} options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Space Grotesk', size: 11 }, padding: 12 },
          },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.parsed} cities`,
            },
          },
        },
      }} />
    </div>
  );
}

/**
 * Measurement comparison bar chart for a single city
 */
export function CityMeasurementsChart({ measurements = {} }) {
  const { temperature, humidity, pm25, pm10, windSpeed } = measurements;

  const labels = [];
  const values = [];
  const colors = [];

  if (temperature !== null && temperature !== undefined) {
    labels.push('Temperature (°C)');
    values.push(temperature);
    colors.push('#f59e0b');
  }
  if (humidity !== null && humidity !== undefined) {
    labels.push('Humidity (%)');
    values.push(humidity);
    colors.push('#3b82f6');
  }
  if (pm25 !== null && pm25 !== undefined) {
    labels.push('PM2.5 (µg/m³)');
    values.push(pm25);
    colors.push('#8b5cf6');
  }
  if (pm10 !== null && pm10 !== undefined) {
    labels.push('PM10 (µg/m³)');
    values.push(pm10);
    colors.push('#ec4899');
  }
  if (windSpeed !== null && windSpeed !== undefined) {
    labels.push('Wind Speed (m/s)');
    values.push(windSpeed);
    colors.push('#06b6d4');
  }

  const data = {
    labels,
    datasets: [{
      label: 'Current Value',
      data: values,
      backgroundColor: colors.map(c => c + 'bb'),
      borderColor: colors,
      borderWidth: 1.5,
      borderRadius: 6,
    }],
  };

  return (
    <div style={{ height: 260 }}>
      <Bar data={data} options={{
        ...defaultOptions,
        plugins: { ...defaultOptions.plugins, legend: { display: false } },
      }} />
    </div>
  );
}
