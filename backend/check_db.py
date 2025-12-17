"""Vérifier la base de données MySQL"""
import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
sys.path.insert(0, parent_dir)

from backend.database import get_db, DB_CONFIG

print(f"Configuration MySQL:")
print(f"  Host: {DB_CONFIG['host']}")
print(f"  Database: {DB_CONFIG['database']}")
print(f"  User: {DB_CONFIG['user']}")

try:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT DATABASE()")
        db_name = cursor.fetchone()["DATABASE()"]
        print(f"\nBase de donnees connectee: {db_name}")
        
        cursor.execute("SHOW TABLES")
        tables = [row[f"Tables_in_{db_name}"] for row in cursor.fetchall()]
        print(f"Tables trouvees: {tables}")
        
        # Compter les utilisateurs
        cursor.execute("SELECT COUNT(*) as count FROM users")
        user_count = cursor.fetchone()["count"]
        print(f"Nombre d'utilisateurs: {user_count}")
        
        print("\nOK: Base de donnees fonctionnelle!")
except Exception as e:
    print(f"\nERREUR: {e}")
    print("\nVerifiez que:")
    print("1. MySQL est demarre")
    print("2. Les identifiants dans database.py sont corrects")
    print("3. La base de donnees existe (executez init_database.py)")
