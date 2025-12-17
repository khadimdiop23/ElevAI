"""
Modèles Pydantic pour la validation des données
"""


from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import date as date_type

class UserCreate(BaseModel):
    age: int = Field(..., ge=1, le=120, description="Âge de l'utilisateur")
    genre: str = Field(..., description="Genre (M/F/Autre)")
    taille_cm: float = Field(..., ge=50, le=250, description="Taille en cm")
    poids_kg: float = Field(..., ge=20, le=300, description="Poids en kg")
    objectif: Optional[str] = Field(None, description="Objectif de bien-être")

class UserResponse(BaseModel):
    id: int
    age: int
    genre: str
    taille_cm: float
    poids_kg: float
    objectif: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

# -------------------
# DAILY DATA MODELS
# -------------------

class DailyDataCreate(BaseModel):
    user_id: int = Field(..., description="ID de l'utilisateur")
    date: date_type = Field(..., description="Date de l'enregistrement")
    sommeil_h: float = Field(..., ge=0, le=24, description="Heures de sommeil")
    pas: int = Field(..., ge=0, description="Nombre de pas")
    sport_min: int = Field(..., ge=0, description="Minutes de sport")
    calories: int = Field(..., ge=0, description="Calories consommées")
    humeur_0_5: int = Field(..., ge=0, le=5, description="Humeur (0-5)")
    stress_0_5: int = Field(..., ge=0, le=5, description="Stress (0-5)")
    fc_repos: int = Field(..., ge=30, le=200, description="Fréquence cardiaque au repos")

class DailyDataResponse(BaseModel):
    id: int
    user_id: int
    date: str
    sommeil_h: Optional[float]
    pas: Optional[int]
    sport_min: Optional[int]
    calories: Optional[int]
    humeur_0_5: Optional[int]
    stress_0_5: Optional[int]
    fc_repos: Optional[int]
    created_at: str

    class Config:
        from_attributes = True

# -------------------
# ANALYSIS MODELS
# -------------------

class AnalysisResponse(BaseModel):
    score: float = Field(..., ge=0, le=100, description="Score de bien-être (0-100)")
    category: str = Field(..., description="Catégorie de bien-être")
    risk_prediction: Optional[str] = Field(None, description="Prédiction de risque")
    explanations: Dict[str, str] = Field(..., description="Explications par dimension")
    recommendations: List[str] = Field(..., description="Recommandations personnalisées")

class User(BaseModel):
    id: int
    age: int
    genre: str
    taille_cm: float
    poids_kg: float
    objectif: Optional[str]

class DailyData(BaseModel):
    
    user_id: int
    date: str
    sommeil_h: float
    pas: int
    sport_min: int
    calories: int
    humeur_0_5: int
    stress_0_5: int
    fc_repos: int


class AnalysisResult(BaseModel):
    id: int
    user_id: int
    score: float
    category: str
    risk_prediction: Optional[str]
    explanations: str
    recommendations: str
