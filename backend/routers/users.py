from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from backend.database import get_connection

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

class UserCreate(BaseModel):
    age: int
    genre: str
    taille_cm: float
    poids_kg: float
    objectif: Optional[str] = None

class User(UserCreate):
    id: int

@router.get("", response_model=List[User])
def get_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    users = [User(id=row["id"], age=row["age"], genre=row["genre"],
                  taille_cm=row["taille_cm"], poids_kg=row["poids_kg"],
                  objectif=row["objectif"]) for row in rows]
    conn.close()
    return users

@router.post("", response_model=User)
def create_user(user: UserCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (age, genre, taille_cm, poids_kg, objectif)
        VALUES (?, ?, ?, ?, ?)
    """, (user.age, user.genre, user.taille_cm, user.poids_kg, user.objectif))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return User(id=user_id, **user.dict())
