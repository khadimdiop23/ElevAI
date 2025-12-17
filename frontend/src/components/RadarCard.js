import React from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function RadarCard({ data }) {
  // Normaliser les données pour le graphique radar (0-100)
  const normalizeValue = (value, max, min = 0) => {
    if (!value && value !== 0) return 0;
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  };

  const chartData = {
    labels: [
      "Sommeil",
      "Sport",
      "Humeur",
      "Stress (inversé)",
      "Activité (pas)"
    ],
    datasets: [
      {
        label: "Dimensions de bien-être",
        data: [
          normalizeValue(data.sommeil_h, 9, 4), // Sommeil: 4-9h optimal
          normalizeValue(data.sport_min, 90, 0), // Sport: 0-90min
          normalizeValue(data.humeur_0_5, 5, 0) * 20, // Humeur: 0-5 -> 0-100
          (1 - normalizeValue(data.stress_0_5, 5, 0) / 5) * 100, // Stress inversé
          normalizeValue(data.pas, 12000, 0), // Pas: 0-12000
        ],
        backgroundColor: "rgba(102, 126, 234, 0.2)",
        borderColor: "rgb(102, 126, 234)",
        pointBackgroundColor: "rgb(102, 126, 234)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(102, 126, 234)",
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const labels = [
              `${data.sommeil_h || 0}h de sommeil`,
              `${data.sport_min || 0} min de sport`,
              `Humeur: ${data.humeur_0_5 || 0}/5`,
              `Stress: ${data.stress_0_5 || 0}/5`,
              `${data.pas || 0} pas`
            ];
            return labels[context.dataIndex];
          }
        }
      }
    }
  };

  return (
    <div className="radar-card">
      <h3 className="card-title">Radar des dimensions</h3>
      <div style={{ height: "300px" }}>
        <Radar data={chartData} options={options} />
      </div>
    </div>
  );
}

export default RadarCard;




