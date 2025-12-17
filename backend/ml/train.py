"""
Script d'entraînement du modèle ML
Utilise RandomForest pour la régression du score de bien-être
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from database import get_db

MODEL_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")

def generate_synthetic_data(n_samples=200):
 
    np.random.seed(76)
    
    data = []
    for _ in range(n_samples):
        sommeil = np.random.normal(7.5, 1.5)
        pas = np.random.normal(8000, 3000)
        sport = np.random.exponential(30)
        calories = np.random.normal(2200, 400)
        humeur = np.random.randint(2, 6)
        stress = np.random.randint(1, 5)
        fc = np.random.normal(65, 10)
        
        # Calcul du score cible (formule simplifiée)
        score = (
            20 * min(sommeil / 9.0, 1.0) +
            15 * min(pas / 12000.0, 1.0) +
            15 * min(sport / 90.0, 1.0) +
            10 * min(calories / 3000.0, 1.0) +
            20 * (humeur / 5.0) +
            15 * (1.0 - stress / 5.0) +
            5 * max(0, 1.0 - abs(fc - 60) / 30.0)
        ) * 100
        
        score = max(0, min(100, score))
        
        data.append({
            "sommeil_h": max(4, min(12, sommeil)),
            "pas": max(0, int(pas)),
            "sport_min": max(0, int(sport)),
            "calories": max(1000, int(calories)),
            "humeur_0_5": humeur,
            "stress_0_5": stress,
            "fc_repos": max(40, min(120, int(fc))),
            "score": score
        })
    
    return pd.DataFrame(data)

def load_training_data():
    """
    Charge les données d'entraînement depuis la base de données
    Combine avec des données synthétiques si nécessaire
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Récupérer toutes les données avec leurs scores calculés
        cursor.execute("""
            SELECT date, sommeil_h, pas, sport_min, calories, humeur_0_5, stress_0_5, fc_repos, score
            FROM daily_data d
            LEFT JOIN analysis_results a ON d.user_id = a.user_id AND d.date = DATE(a.created_at)
            ORDER BY d.date DESC
            LIMIT 1000
        """)
        rows = cursor.fetchall()
    
    if len(rows) < 50:
        # Pas assez de données réelles, utiliser des données synthétiques
        print("Pas assez de données réelles, génération de données synthétiques...")
        df = generate_synthetic_data(200)
    else:
        # Convertir en DataFrame
        data = []
        for row in rows:
            if row["score"] is None:
                # Calculer le score si absent
                from model import calculate_score_simple, normalize_features
                features = normalize_features(dict(row))
                score = calculate_score_simple(features)
            else:
                score = row["score"]
            
            data.append({
                "sommeil_h": row["sommeil_h"] or 7.0,
                "pas": row["pas"] or 5000,
                "sport_min": row["sport_min"] or 0,
                "calories": row["calories"] or 2000,
                "humeur_0_5": row["humeur_0_5"] or 3,
                "stress_0_5": row["stress_0_5"] or 3,
                "fc_repos": row["fc_repos"] or 70,
                "score": score
            })
        
        df = pd.DataFrame(data)
        
        # Compléter avec des données synthétiques si nécessaire
        if len(df) < 100:
            synthetic = generate_synthetic_data(100 - len(df))
            df = pd.concat([df, synthetic], ignore_index=True)
    
    return df

def prepare_features(df):
    """
    Prépare les features pour l'entraînement
    """
    from model import normalize_features
    
    X = []
    for _, row in df.iterrows():
        features = normalize_features(row.to_dict())
        X.append(features.flatten())
    
    return np.array(X), df["score"].values

def train_model():
    """
    Entraîne le modèle RandomForest
    """
    print("Chargement des données d'entraînement...")
    df = load_training_data()
    
    print(f"Nombre d'échantillons: {len(df)}")
    
    print("Préparation des features...")
    X, y = prepare_features(df)
    
    print("Division train/test...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print("Entraînement du modèle RandomForest...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    print("Évaluation du modèle...")
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    train_mse = mean_squared_error(y_train, y_pred_train)
    test_mse = mean_squared_error(y_test, y_pred_test)
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)
    
    print(f"\nMétriques d'entraînement:")
    print(f"  MSE Train: {train_mse:.2f}")
    print(f"  MSE Test: {test_mse:.2f}")
    print(f"  R² Train: {train_r2:.3f}")
    print(f"  R² Test: {test_r2:.3f}")
    
    print(f"\nSauvegarde du modèle dans {MODEL_PATH}...")
    joblib.dump(model, MODEL_PATH)
    print("Modèle sauvegardé avec succès!")
    
    return model, test_r2

if __name__ == "__main__":
    train_model()

