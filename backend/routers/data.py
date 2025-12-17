"""
Routes pour la gestion des données quotidiennes
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import date
from backend.models import DailyDataCreate, DailyDataResponse
from backend.database import get_connection

router = APIRouter(prefix="/data", tags=["data"])

@router.post("", response_model=DailyDataResponse, status_code=201)
def create_daily_data(data: DailyDataCreate):
    """Ajouter un enregistrement quotidien"""
    conn = get_connection()
    cursor = conn.cursor()

    # Vérifier que l'utilisateur existe
    cursor.execute("SELECT id FROM users WHERE id = ?", (data.user_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    try:
        # SQLite : INSERT OR REPLACE pour remplacer si la date existe déjà
        cursor.execute("""
            INSERT OR REPLACE INTO daily_data 
            (id, user_id, date, sommeil_h, pas, sport_min, calories, humeur_0_5, stress_0_5, fc_repos)
            VALUES (
                (SELECT id FROM daily_data WHERE user_id = ? AND date = ?),
                ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        """, (
            data.user_id, data.date.isoformat(),
            data.user_id, data.date.isoformat(), data.sommeil_h, data.pas, data.sport_min, 
            data.calories, data.humeur_0_5, data.stress_0_5, data.fc_repos
        ))
        conn.commit()
        data_id = cursor.lastrowid

        cursor.execute("""
            SELECT id, user_id, date, sommeil_h, pas, sport_min, calories, 
                   humeur_0_5, stress_0_5, fc_repos, created_at
            FROM daily_data WHERE id = ?
        """, (data_id,))
        row = cursor.fetchone()
        conn.close()

        return DailyDataResponse(
            id=row["id"],
            user_id=row["user_id"],
            date=str(row["date"]) if row["date"] else None,
            sommeil_h=float(row["sommeil_h"]) if row["sommeil_h"] is not None else None,
            pas=row["pas"],
            sport_min=row["sport_min"],
            calories=row["calories"],
            humeur_0_5=row["humeur_0_5"],
            stress_0_5=row["stress_0_5"],
            fc_repos=row["fc_repos"],
            created_at=str(row["created_at"]) if row["created_at"] else None
        )
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Erreur lors de l'ajout: {str(e)}")


@router.get("/{user_id}", response_model=List[DailyDataResponse])
def get_user_data(
    user_id: int,
    from_date: Optional[str] = Query(None, alias="from", description="Date de début (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, alias="to", description="Date de fin (YYYY-MM-DD)")
):
    """Récupérer l'historique complet d'un utilisateur avec filtres optionnels"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    query = """
        SELECT id, user_id, date, sommeil_h, pas, sport_min, calories, 
               humeur_0_5, stress_0_5, fc_repos, created_at
        FROM daily_data 
        WHERE user_id = ?
    """
    params = [user_id]

    if from_date:
        query += " AND date >= ?"
        params.append(from_date)
    if to_date:
        query += " AND date <= ?"
        params.append(to_date)

    query += " ORDER BY date DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [
        DailyDataResponse(
            id=row["id"],
            user_id=row["user_id"],
            date=str(row["date"]) if row["date"] else None,
            sommeil_h=float(row["sommeil_h"]) if row["sommeil_h"] is not None else None,
            pas=row["pas"],
            sport_min=row["sport_min"],
            calories=row["calories"],
            humeur_0_5=row["humeur_0_5"],
            stress_0_5=row["stress_0_5"],
            fc_repos=row["fc_repos"],
            created_at=str(row["created_at"]) if row["created_at"] else None
        )
        for row in rows
    ]
