import React, { useState, useEffect } from "react";
import axios from "axios";
import ScoreCard from "../components/ScoreCard";
import RadarCard from "../components/RadarCard";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

const API_URL = "http://localhost:8000";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard({ user }) {
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDailyForm, setShowDailyForm] = useState(false);
  const [dailyForm, setDailyForm] = useState({
    date: "",
    sommeil_h: "",
    pas: "",
    sport_min: "",
    calories: "",
    humeur_0_5: "",
    stress_0_5: "",
    fc_repos: ""
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const analysisResponse = await axios.get(`${API_URL}/analyze/${user.id}`);
      setAnalysis(analysisResponse.data);
    } catch (err) {
      if (err.response?.status === 404) setAnalysis(null);
      else setError(err.response?.data?.detail || "Erreur lors du chargement de l'analyse");
    }

    try {
      const historyResponse = await axios.get(`${API_URL}/data/${user.id}`);
      setHistory(historyResponse.data);
    } catch (err) {
      if (err.response?.status === 404) setHistory([]);
      else setError(err.response?.data?.detail || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleDailyChange = (e) => {
    setDailyForm({ ...dailyForm, [e.target.name]: e.target.value });
  };

  const handleDailySubmit = async (e) => {
    e.preventDefault();

    for (const key in dailyForm) {
      if (dailyForm[key] === "") {
        alert(`Veuillez remplir le champ : ${key.replace("_", " ")}`);
        return;
      }
    }

    const payload = {
      user_id: user.id,
      date: dailyForm.date,
      sommeil_h: Math.min(Math.max(parseFloat(dailyForm.sommeil_h), 0), 24),
      pas: Math.max(parseInt(dailyForm.pas), 0),
      sport_min: Math.max(parseInt(dailyForm.sport_min), 0),
      calories: Math.max(parseInt(dailyForm.calories), 0),
      humeur_0_5: Math.min(Math.max(parseInt(dailyForm.humeur_0_5), 0), 5),
      stress_0_5: Math.min(Math.max(parseInt(dailyForm.stress_0_5), 0), 5),
      fc_repos: Math.min(Math.max(parseInt(dailyForm.fc_repos), 30), 200),
    };

    try {
      await axios.post(`${API_URL}/data`, payload, {
        headers: { "Content-Type": "application/json" }
      });
      alert("Données journalières ajoutées !");
      fetchData();
      setDailyForm({
        date: "",
        sommeil_h: "",
        pas: "",
        sport_min: "",
        calories: "",
        humeur_0_5: "",
        stress_0_5: "",
        fc_repos: ""
      });
      setShowDailyForm(false);
    } catch (err) {
      const message = err.response?.data?.detail || "Erreur lors de l'ajout des données journalières";
      alert(message);
    }
  };

  const prepareChartData = () => {
    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const dates = sortedHistory.map(item => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const scores = sortedHistory.map(item => {
      const sommeil = item.sommeil_h;
      const sport = item.sport_min;
      const humeur = item.humeur_0_5;
      const stress = item.stress_0_5;
      const pas = item.pas;

      return Math.round(
        20 * Math.min(sommeil / 9, 1) +
        15 * Math.min(pas / 12000, 1) +
        15 * Math.min(sport / 90, 1) +
        20 * (humeur / 5) +
        15 * (1 - stress / 5) +
        15
      );
    });

    return {
      labels: dates,
      datasets: [{
        label: "Score de bien-être",
        data: scores,
        borderColor: "rgb(102,126,234)",
        backgroundColor: "rgba(102,126,234,0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "rgb(102,126,234)"
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      title: { display: true, text: "Évolution du score de bien-être", font: { size: 16 } }
    },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { stepSize: 10 } }
    }
  };

  if (loading) return <div className="loading">Chargement du dashboard...</div>;
  if (error) return (
    <div className="dashboard-container">
      <div className="error">{error}</div>
      <button className="btn" onClick={fetchData}>Réessayer</button>
    </div>
  );

  const dimensions = {
    sommeil_h: history[0]?.sommeil_h || 0,
    sport_min: history[0]?.sport_min || 0,
    stress_0_5: history[0]?.stress_0_5 || 0,
    humeur_0_5: history[0]?.humeur_0_5 || 0,
    pas: history[0]?.pas || 0
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <button className="btn" onClick={() => setShowDailyForm(!showDailyForm)} style={{ marginBottom: "1rem" }}>
          {showDailyForm ? "Annuler" : "+ Ajouter une entrée quotidienne"}
        </button>
      </div>

      {showDailyForm && (
        <form 
          data-testid="daily-form"
          onSubmit={handleDailySubmit} 
          style={{ display: "grid", gap: "0.5rem", marginBottom: "1.5rem" }}
        >
          <input type="date" name="date" value={dailyForm.date} onChange={handleDailyChange} required />
          <input type="number" name="sommeil_h" placeholder="Sommeil (h)" value={dailyForm.sommeil_h} onChange={handleDailyChange} required />
          <input type="number" name="pas" placeholder="Pas" value={dailyForm.pas} onChange={handleDailyChange} required />
          <input type="number" name="sport_min" placeholder="Sport (min)" value={dailyForm.sport_min} onChange={handleDailyChange} required />
          <input type="number" name="calories" placeholder="Calories" value={dailyForm.calories} onChange={handleDailyChange} required />
          <input type="number" name="humeur_0_5" placeholder="Humeur (0-5)" value={dailyForm.humeur_0_5} onChange={handleDailyChange} required />
          <input type="number" name="stress_0_5" placeholder="Stress (0-5)" value={dailyForm.stress_0_5} onChange={handleDailyChange} required />
          <input type="number" name="fc_repos" placeholder="Fréquence cardiaque repos" value={dailyForm.fc_repos} onChange={handleDailyChange} required />
          <button type="submit" data-testid="submit-daily" className="btn">Ajouter</button>
        </form>
      )}

      <div className="cards-grid">
        {analysis && (
          <ScoreCard 
            data-testid="score-card"
            score={analysis.score} 
            category={analysis.category} 
            explanations={analysis.explanations}
            recommendations={analysis.recommendations}
            risk_prediction={analysis.risk_prediction}
          />
        )}
        <RadarCard data={dimensions} />
      </div>

      {history.length > 0 && (
        <div className="chart-card" style={{ marginTop: "1.5rem", height: "300px" }}>
          <Line data={prepareChartData()} options={chartOptions} />
        </div>
      )}
    </div>
  );
}

export default Dashboard;
