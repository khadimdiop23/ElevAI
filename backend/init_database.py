"""
Script pour initialiser la base de données MySQL
"""

import sys
import os

# Ajouter le répertoire parent au PYTHONPATH
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
sys.path.insert(0, parent_dir)

from backend.database import init_db, DB_CONFIG

if __name__ == "__main__":
    print(f"Initialisation de la base de donnees MySQL")
    print(f"Host: {DB_CONFIG['host']}")
    print(f"Database: {DB_CONFIG['database']}")
    print(f"User: {DB_CONFIG['user']}")
    try:
        init_db()
        print("OK: Base de donnees initialisee avec succes!")
        print(f"   Base de donnees: {DB_CONFIG['database']}")
    except Exception as e:
        print(f"ERREUR lors de l'initialisation: {e}")
        print("\nAssurez-vous que:")
        print("1. MySQL est installe et demarre")
        print("2. Les identifiants dans database.py sont corrects")
        print("3. L'utilisateur MySQL a les droits de creation de base de donnees")
        sys.exit(1)
