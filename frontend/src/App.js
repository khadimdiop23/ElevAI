import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddEntry from "./pages/AddEntry";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  // Charger l'utilisateur depuis le localStorage au démarrage
  useEffect(() => {
    const savedUser = localStorage.getItem("elevai_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Sauvegarder l'utilisateur dans le localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("elevai_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("elevai_user");
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>ElevAI - Coach numérique intelligent de bien-être</h1>
          {user && (
            <div className="user-info">
              <span>Utilisateur: {user.name || `ID ${user.id}`}</span>
              <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
            </div>
          )}
        </header>
        
        <main className="App-main">
          <Routes>
            <Route 
              path="/" 
              element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} 
            />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/add-entry" 
              element={user ? <AddEntry user={user} /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
