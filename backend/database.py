import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "elevai.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_db():
    """Utilisation avec 'with': 'with get_db() as conn:'"""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    # Table users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        age INTEGER NOT NULL,
        genre TEXT NOT NULL,
        taille_cm REAL NOT NULL,
        poids_kg REAL NOT NULL,
        objectif TEXT
    )
    """)
    # Table daily_data
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        sommeil_h REAL,
        pas INTEGER,
        sport_min REAL,
        calories INTEGER,
        humeur_0_5 REAL,
        stress_0_5 REAL,
        fc_repos INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)
    # Table analysis_results (optionnel si tu veux stocker les analyses)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analysis_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        score REAL,
        category TEXT,
        risk_prediction TEXT,
        explanations TEXT,
        recommendations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)
    conn.commit()
    conn.close()
