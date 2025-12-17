import React from "react";
import "./ScoreCard.css"; 

function ScoreCard({ score, category, risk_prediction, explanations, recommendations }) {
  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981"; 
    if (score >= 65) return "#0ea5e9"; 
    if (score >= 50) return "#f59e0b"; 
    return "#ef4444"; 
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 65) return "Bon";
    if (score >= 50) return "Moyen";
    return "À améliorer";
  };

  const formatMetricName = (key) => {
    const names = {
      sommeil_h: "Sommeil",
      pas: "Activité",
      sport_min: "Sport",
      calories: "Nutrition",
      humeur_0_5: "Humeur",
      stress_0_5: "Stress",
      fc_repos: "Fréquence cardiaque"
    };
    return names[key] || key.replace("_", " ");
  };

  const getTrendIcon = (value) => {
    if (value === "+") return "++";
    if (value === "-") return "--";
    if (value === "=") return "==";
    return "";
  };

  return (
    <div className="score-card" data-testid="score-card">
      <div className="score-header">
        <h2 className="score-title">Score de bien-être</h2>
        <div className="score-badge">{getScoreLabel(score)}</div>
      </div>

      <div className="score-display">
        <div className="score-circle" style={{ borderColor: getScoreColor(score) }}>
          <span className="score-number">{Math.round(score)}</span>
          <span className="score-out-of">/100</span>
        </div>
        <div className="score-details">
          <div className="category-tag">
            <span className="tag-label">Catégorie :</span>
            <span className="tag-value">{category || "Non évalué"}</span>
          </div>
          
          {risk_prediction && (
            <div className="risk-alert">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <span className="alert-title">Tendance</span>
                <p className="alert-message">{risk_prediction}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {explanations && Object.keys(explanations).length > 0 && (
        <div className="metrics-section">
          <h3 className="section-title">Indicateurs clés</h3>
          <div className="metrics-grid">
            {Object.entries(explanations).map(([key, value]) => (
              <div key={key} className="metric-item">
                <div className="metric-header">
                  <span className="metric-name">{formatMetricName(key)}</span>
                  <span className="metric-trend">{getTrendIcon(value)}</span>
                </div>
                <div className="metric-bar">
                  <div 
                    className={`metric-fill ${value === '+' ? 'positive' : value === '-' ? 'negative' : 'neutral'}`}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="recommendations-section">
          <div className="section-header">
            <h3 className="section-title">Recommandations personnalisées</h3>
            <div className="recommendations-count">{recommendations.length}</div>
          </div>
          <div className="recommendations-list" data-testid="recommendations-list">
            {recommendations.map((rec, index) => (
              <div key={index} className="recommendation-card">
                <div className="recommendation-number">0{index + 1}</div>
                <div className="recommendation-content">
                  <p>{rec}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScoreCard;
