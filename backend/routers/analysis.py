"""
Routes pour l'analyse et les recommandations
"""

from fastapi import APIRouter, HTTPException
from backend.models import AnalysisResponse
from backend.database import get_connection
from backend.ml.model import predict_wellness_score, get_recommendations, get_explanations
import json

router = APIRouter(prefix="/analyze", tags=["analysis"])

@router.get("/{user_id}", response_model=AnalysisResponse)
def analyze_user(user_id: int):
    """Calculer le score global et l'analyse courante"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Vérifier que l'utilisateur existe
    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Récupérer les 30 derniers jours de données
    cursor.execute("""
        SELECT date, sommeil_h, pas, sport_min, calories, humeur_0_5, stress_0_5, fc_repos
        FROM daily_data 
        WHERE user_id = ? 
        ORDER BY date DESC 
        LIMIT 30
    """, (user_id,))
    rows = cursor.fetchall()
    
    if not rows:
        conn.close()
        raise HTTPException(status_code=404, detail="Aucune donnée trouvée pour cet utilisateur")
    
    # Convertir en dict pour le ML
    latest_data = dict(rows[0])
    recent_data = [dict(row) for row in rows[:7]]  # 7 derniers jours
    
    # Calculer le score avec le modèle ML
    score, category = predict_wellness_score(latest_data, recent_data)
    
    # Générer les explications
    explanations = get_explanations(latest_data, recent_data)
    
    # Prédiction de risque simple
    risk_prediction = predict_risk(recent_data)
    
    # Recommandations
    recommendations = get_recommendations(score, latest_data, recent_data, explanations)
    
    # Sauvegarder dans analysis_results
    cursor.execute("""
        INSERT INTO analysis_results 
        (user_id, score, category, risk_prediction, explanations, recommendations)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        score,
        category,
        risk_prediction,
        json.dumps(explanations),
        json.dumps(recommendations)
    ))
    conn.commit()
    conn.close()
    
    return AnalysisResponse(
        score=score,
        category=category,
        risk_prediction=risk_prediction,
        explanations=explanations,
        recommendations=recommendations
    )

def predict_risk(recent_data):
    """Prédiction simple du risque basée sur les tendances"""
    if len(recent_data) < 3:
        return None
    
    stress_values = [row.get("stress_0_5") for row in recent_data[:3] if row.get("stress_0_5") is not None]
    if stress_values:
        avg_stress = sum(stress_values) / len(stress_values)
        if avg_stress > 3.5:
            return "Stress en hausse probable sur 3 jours"
        elif avg_stress < 2:
            return "Tendance positive maintenue"
    return None