import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Analytics = () => {
  const data = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril'],
    datasets: [
      {
        label: 'Escaneos',
        data: [50, 75, 150, 200],
        backgroundColor: 'rgba(255, 159, 64, 0.8)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Escaneos Mensuales' },
    },
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Analítica</h2>
      <Bar data={data} options={options} />
    </div>
  );
};

export default Analytics;
