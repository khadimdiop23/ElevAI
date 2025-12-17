"""
Modèle ML pour la prédiction du score de bien-être
Utilise RandomForest pour la régression du score (0-100)
"""

import numpy as np
import joblib
import os
from typing import Dict, List, Tuple, Optional

# Chemins
MODEL_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")

def normalize_features(data_dict: Dict) -> np.ndarray:
    """
    Normalise les features pour le modèle
    Gère les valeurs manquantes et normalise les échelles
    """
    features = []
    
    # Sommeil (0-24h) -> normalisé 0-1 (optimal: 7-9h = 0.7-0.9)
    sommeil = data_dict.get("sommeil_h") or 7.0
    features.append(min(sommeil / 9.0, 1.0))
    
    # Pas (0-20000+) -> normalisé 0-1 (optimal: 8000-12000 = 0.6-0.8)
    pas = data_dict.get("pas") or 5000
    features.append(min(pas / 12000.0, 1.0))
    
    # Sport (0-180min+) -> normalisé 0-1 (optimal: 30-60min = 0.5-0.7)
    sport = data_dict.get("sport_min") or 0
    features.append(min(sport / 90.0, 1.0))
    
    # Calories (0-4000+) -> normalisé 0-1 (optimal: 1800-2500 = 0.5-0.7)
    calories = data_dict.get("calories") or 2000
    features.append(min(calories / 3000.0, 1.0))
    
    # Humeur (0-5) -> normalisé 0-1
    humeur = data_dict.get("humeur_0_5") or 3
    features.append(humeur / 5.0)
    
    # Stress (0-5, inversé) -> normalisé 0-1 (moins de stress = mieux)
    stress = data_dict.get("stress_0_5") or 3
    features.append(1.0 - (stress / 5.0))
    
    # FC repos (30-200) -> normalisé 0-1 (optimal: 50-70 = 0.7-0.9)
    fc = data_dict.get("fc_repos") or 70
    if fc < 50:
        features.append(0.5)
    elif fc > 100:
        features.append(0.3)
    else:
        features.append(1.0 - ((fc - 50) / 50.0))
    
    return np.array(features).reshape(1, -1)

def calculate_score_simple(features: np.ndarray) -> float:
    """
    Calcul simple du score basé sur une formule pondérée
    Utilisé si le modèle n'est pas encore entraîné
    """
    weights = np.array([0.20, 0.15, 0.15, 0.10, 0.20, 0.15, 0.05])
    score = np.dot(features.flatten(), weights) * 100
    return max(0, min(100, score))

def predict_wellness_score(latest_data: Dict, recent_data: List[Dict]) -> Tuple[float, str]:
    """
    Prédit le score de bien-être (0-100) et la catégorie
    """
    # Normaliser les features
    features = normalize_features(latest_data)
    
    # Calculer moyenne mobile sur 3 jours pour certaines features
    if len(recent_data) >= 3:
        avg_sommeil = np.mean([d.get("sommeil_h") or 7.0 for d in recent_data[:3]])
        avg_sport = np.mean([d.get("sport_min") or 0 for d in recent_data[:3]])
        avg_stress = np.mean([d.get("stress_0_5") or 3 for d in recent_data[:3]])
        
        # Ajuster les features avec la moyenne mobile
        features[0][0] = min(avg_sommeil / 9.0, 1.0)  # sommeil
        features[0][2] = min(avg_sport / 90.0, 1.0)   # sport
        features[0][5] = 1.0 - (avg_stress / 5.0)     # stress (inversé)
    
    # Essayer de charger le modèle entraîné
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            score = model.predict(features)[0]
            score = max(0, min(100, score))
        else:
            # Utiliser la formule simple
            score = calculate_score_simple(features)
    except Exception:
        # Fallback sur la formule simple
        score = calculate_score_simple(features)
    
    # Déterminer la catégorie
    if score >= 80:
        category = "Excellent équilibre"
    elif score >= 65:
        category = "Bon équilibre"
    elif score >= 50:
        category = "Équilibre moyen"
    else:
        category = "Équilibre à améliorer"
    
    return round(score, 1), category

def get_explanations(latest_data: Dict, recent_data: List[Dict]) -> Dict[str, str]:
    """
    Génère des explications qualitatives par dimension
    """
    explanations = {}
    
    # Sommeil
    sommeil = latest_data.get("sommeil_h") or 0
    if sommeil >= 7 and sommeil <= 9:
        explanations["sommeil_h"] = "+"
    elif sommeil < 6:
        explanations["sommeil_h"] = "-"
    else:
        explanations["sommeil_h"] = "="
    
    # Sport
    sport = latest_data.get("sport_min") or 0
    if sport >= 30:
        explanations["sport_min"] = "+"
    elif sport < 15:
        explanations["sport_min"] = "-"
    else:
        explanations["sport_min"] = "="
    
    # Stress
    stress = latest_data.get("stress_0_5") or 3
    if stress <= 2:
        explanations["stress_0_5"] = "+"
    elif stress >= 4:
        explanations["stress_0_5"] = "-"
    else:
        explanations["stress_0_5"] = "="
    
    # Humeur
    humeur = latest_data.get("humeur_0_5") or 3
    if humeur >= 4:
        explanations["humeur_0_5"] = "+"
    elif humeur <= 2:
        explanations["humeur_0_5"] = "-"
    else:
        explanations["humeur_0_5"] = "="
    
    # Pas
    pas = latest_data.get("pas") or 0
    if pas >= 8000:
        explanations["pas"] = "+"
    elif pas < 5000:
        explanations["pas"] = "-"
    else:
        explanations["pas"] = "="
    
    return explanations

def get_recommendations(
    score: float, 
    latest_data: Dict, 
    recent_data: List[Dict], 
    explanations: Dict[str, str]
) -> List[str]:
    """
    Génère des recommandations personnalisées basées sur le score et les données
    """
    recommendations = []
    
    # Recommandations basées sur le sommeil
    sommeil = latest_data.get("sommeil_h") or 0
    if sommeil < 7:
        recommendations.append(f"Avance ton coucher de {int((7 - sommeil) * 60)} minutes pendant 3 jours")
    elif sommeil > 9:
        recommendations.append("Réduis légèrement ton temps de sommeil pour optimiser la récupération")
    
    # Recommandations basées sur l'activité
    pas = latest_data.get("pas") or 0
    if pas < 6000:
        recommendations.append("Marche 20 minutes après le déjeuner")
    
    sport = latest_data.get("sport_min") or 0
    if sport < 20:
        recommendations.append("Intègre 30 minutes d'activité physique modérée 3 fois par semaine")
    
    # Recommandations basées sur le stress
    stress = latest_data.get("stress_0_5") or 3
    if stress >= 4:
        recommendations.append("Pratique 10 minutes de méditation ou de respiration profonde quotidiennement")
    
    # Recommandations générales
    if score < 60:
        recommendations.append("Hydratation : objectif 2 L/j")
        recommendations.append("Établis une routine de sommeil régulière")
    
    # Si pas assez de recommandations, en ajouter des génériques
    if len(recommendations) < 2:
        recommendations.append("Continue tes bonnes habitudes !")
        if score >= 80:
            recommendations.append("Maintiens ce rythme, tu es sur la bonne voie")
    
    return recommendations[:5]  # Limiter à 5 recommandations




