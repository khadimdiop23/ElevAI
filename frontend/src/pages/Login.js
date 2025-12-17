import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";

function Login({ setUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    genre: "M",
    taille_cm: "",
    poids_kg: "",
    objectif: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setUser({ id: user.id, name: user.objectif || `Utilisateur ${user.id}` });
    navigate("/dashboard");
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // Validation des champs requis
      if (!formData.age || !formData.taille_cm || !formData.poids_kg) {
        alert("Veuillez remplir tous les champs obligatoires");
        return;
      }

      // Conversion et validation des valeurs numériques
      const age = parseInt(formData.age);
      const taille_cm = parseFloat(formData.taille_cm);
      const poids_kg = parseFloat(formData.poids_kg);

      if (isNaN(age) || age < 1 || age > 120) {
        alert("L'âge doit être entre 1 et 120 ans");
        return;
      }

      if (isNaN(taille_cm) || taille_cm < 50 || taille_cm > 250) {
        alert("La taille doit être entre 50 et 250 cm");
        return;
      }

      if (isNaN(poids_kg) || poids_kg < 20 || poids_kg > 300) {
        alert("Le poids doit être entre 20 et 300 kg");
        return;
      }

      const response = await axios.post(`${API_URL}/users`, {
        age: age,
        genre: formData.genre,
        taille_cm: taille_cm,
        poids_kg: poids_kg,
        objectif: formData.objectif && formData.objectif.trim() !== "" ? formData.objectif.trim() : null
      });
      
      setUser({ id: response.data.id, name: response.data.objectif || `Utilisateur ${response.data.id}` });
      navigate("/dashboard");
    } catch (error) {
      let errorMessage = "Erreur lors de la création du profil";
      
      if (error.response?.data?.detail) {
        // Si c'est une liste d'erreurs de validation Pydantic
        if (Array.isArray(error.response.data.detail)) {
          const validationErrors = error.response.data.detail.map(err => {
            const field = err.loc ? err.loc.join('.') : 'champ';
            return `${field}: ${err.msg}`;
          }).join('\n');
          errorMessage = `Erreurs de validation:\n${validationErrors}`;
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage += ": " + error.message;
      }
      
      alert(errorMessage);
      console.error("Erreur complète:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="login-container">
      <h2>Connexion / Sélection d'utilisateur</h2>
      
      {users.length > 0 && (
        <div>
          <h3>Utilisateurs existants:</h3>
          <ul className="user-list">
            {users.map((user) => (
              <li key={user.id} className="user-item" onClick={() => handleSelectUser(user)}>
                <strong>Utilisateur {user.id}</strong> - {user.age} ans, {user.genre}
                {user.objectif && <div style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.25rem" }}>
                  {user.objectif}
                </div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="create-user-form">
        <button 
          className="btn" 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ background: showCreateForm ? "#6c757d" : "#28a745" }}
        >
          {showCreateForm ? "Annuler" : "Créer un nouveau profil"}
        </button>

        {showCreateForm && (
          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label>Âge *</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                min="1"
                max="120"
              />
            </div>

            <div className="form-group">
              <label>Genre *</label>
              <select name="genre" value={formData.genre} onChange={handleChange} required>
                <option value="M">Homme</option>
                <option value="F">Femme</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div className="form-group">
              <label>Taille (cm) *</label>
              <input
                type="number"
                name="taille_cm"
                value={formData.taille_cm}
                onChange={handleChange}
                required
                min="50"
                max="250"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label>Poids (kg) *</label>
              <input
                type="number"
                name="poids_kg"
                value={formData.poids_kg}
                onChange={handleChange}
                required
                min="20"
                max="300"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label>Objectif (optionnel)</label>
              <textarea
                name="objectif"
                value={formData.objectif}
                onChange={handleChange}
                rows="3"
                placeholder="Ex: Améliorer le sommeil"
              />
            </div>

            <button type="submit" className="btn">Créer le profil</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
