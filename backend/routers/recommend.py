"""
Routes pour les recommandations personnalisées
"""

from fastapi import APIRouter, HTTPException
from typing import List
from backend.database import get_db
from backend.ml.model import get_recommendations, get_explanations
import json

router = APIRouter(prefix="/recommend", tags=["recommendations"])

@router.get("/{user_id}")
def get_user_recommendations(user_id: int):
    """Obtenir les recommandations personnalisées pour un utilisateur"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Vérifier que l'utilisateur existe
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        # Récupérer les dernières données
        cursor.execute("""
            SELECT date, sommeil_h, pas, sport_min, calories, humeur_0_5, stress_0_5, fc_repos
            FROM daily_data 
            WHERE user_id = %s 
            ORDER BY date DESC 
            LIMIT 7
        """, (user_id,))
        rows = cursor.fetchall()
        
        if not rows:
            raise HTTPException(status_code=404, detail="Aucune donnée trouvée pour cet utilisateur")
        
        latest_data = rows[0]
        recent_data = rows
        
        # Calculer le score approximatif
        from backend.ml.model import predict_wellness_score
        score, _ = predict_wellness_score(latest_data, recent_data)
        
        # Générer les explications
        explanations = get_explanations(latest_data, recent_data)
        
        # Obtenir les recommandations
        recommendations = get_recommendations(score, latest_data, recent_data, explanations)
        
        return {
            "user_id": user_id,
            "recommendations": recommendations,
            "explanations": explanations
        }

