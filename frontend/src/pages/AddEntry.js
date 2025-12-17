import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8000";

function AddEntry({ user }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    sommeil_h: "",
    pas: "",
    sport_min: "",
    calories: "",
    humeur_0_5: "",
    stress_0_5: "",
    fc_repos: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError(null);
  };

  const validateForm = () => {
    const errors = [];

    if (form.sommeil_h && (form.sommeil_h < 0 || form.sommeil_h > 24)) {
      errors.push("Le sommeil doit être entre 0 et 24 heures");
    }

    if (form.pas && form.pas < 0) {
      errors.push("Le nombre de pas doit être positif");
    }

    if (form.sport_min && form.sport_min < 0) {
      errors.push("Les minutes de sport doivent être positives");
    }

    if (form.calories && form.calories < 0) {
      errors.push("Les calories doivent être positives");
    }

    if (form.humeur_0_5 && (form.humeur_0_5 < 0 || form.humeur_0_5 > 5)) {
      errors.push("L'humeur doit être entre 0 et 5");
    }

    if (form.stress_0_5 && (form.stress_0_5 < 0 || form.stress_0_5 > 5)) {
      errors.push("Le stress doit être entre 0 et 5");
    }

    if (form.fc_repos && (form.fc_repos < 30 || form.fc_repos > 200)) {
      errors.push("La fréquence cardiaque doit être entre 30 et 200");
    }

    if (errors.length > 0) {
      setError(errors.join(", "));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        user_id: user.id,
        date: form.date,
        sommeil_h: form.sommeil_h ? parseFloat(form.sommeil_h) : null,
        pas: form.pas ? parseInt(form.pas) : null,
        sport_min: form.sport_min ? parseInt(form.sport_min) : null,
        calories: form.calories ? parseInt(form.calories) : null,
        humeur_0_5: form.humeur_0_5 ? parseInt(form.humeur_0_5) : null,
        stress_0_5: form.stress_0_5 ? parseInt(form.stress_0_5) : null,
        fc_repos: form.fc_repos ? parseInt(form.fc_repos) : null,
      };

      await axios.post(`${API_URL}/data`, payload);
      
      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'ajout des données");
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-entry-container">
      <h2>Ajouter une journée de données</h2>

      {success && (
        <div className="success-message">
          Données ajoutées avec succès ! Redirection vers le dashboard...
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Date *</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Sommeil (heures)</label>
            <input
              type="number"
              name="sommeil_h"
              value={form.sommeil_h}
              onChange={handleChange}
              min="0"
              max="24"
              step="0.1"
              placeholder="Ex: 7.5"
            />
          </div>

          <div className="form-group">
            <label>Nombre de pas</label>
            <input
              type="number"
              name="pas"
              value={form.pas}
              onChange={handleChange}
              min="0"
              placeholder="Ex: 8500"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Sport (minutes)</label>
            <input
              type="number"
              name="sport_min"
              value={form.sport_min}
              onChange={handleChange}
              min="0"
              placeholder="Ex: 30"
            />
          </div>

          <div className="form-group">
            <label>Calories</label>
            <input
              type="number"
              name="calories"
              value={form.calories}
              onChange={handleChange}
              min="0"
              placeholder="Ex: 2200"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Humeur (0-5)</label>
            <input
              type="number"
              name="humeur_0_5"
              value={form.humeur_0_5}
              onChange={handleChange}
              min="0"
              max="5"
              placeholder="0 = très bas, 5 = excellent"
            />
          </div>

          <div className="form-group">
            <label>Stress (0-5)</label>
            <input
              type="number"
              name="stress_0_5"
              value={form.stress_0_5}
              onChange={handleChange}
              min="0"
              max="5"
              placeholder="0 = aucun, 5 = très élevé"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Fréquence cardiaque au repos (bpm)</label>
          <input
            type="number"
            name="fc_repos"
            value={form.fc_repos}
            onChange={handleChange}
            min="30"
            max="200"
            placeholder="Ex: 65"
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Enregistrement..." : "Ajouter les données"}
        </button>
      </form>
    </div>
  );
}

export default AddEntry;
