# Configuration MySQL pour ElevAI

## Installation

1. **Installer MySQL** (si ce n'est pas déjà fait)
   - Windows: Télécharger depuis https://dev.mysql.com/downloads/mysql/
   - Ou utiliser XAMPP/WAMP qui inclut MySQL

2. **Installer les dépendances Python**
   ```bash
   cd backend
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

## Configuration

1. **Modifier les paramètres de connexion** dans `backend/database.py`:
   ```python
   DB_CONFIG = {
       'host': 'localhost',      # Adresse du serveur MySQL
       'user': 'root',           # Nom d'utilisateur MySQL
       'password': '',           # Mot de passe MySQL
       'database': 'elevai',     # Nom de la base de données
       ...
   }
   ```

2. **Ou utiliser des variables d'environnement**:
   ```bash
   set DB_HOST=localhost
   set DB_USER=root
   set DB_PASSWORD=votre_mot_de_passe
   set DB_NAME=elevai
   ```

## Initialisation

1. **Démarrer MySQL** (si nécessaire)

2. **Initialiser la base de données**:
   ```bash
   cd backend
   .\venv\Scripts\python.exe init_database.py
   ```

   Cela va:
   - Créer la base de données `elevai` si elle n'existe pas
   - Créer toutes les tables nécessaires

## Vérification

Pour vérifier que tout fonctionne:
```bash
cd backend
.\venv\Scripts\python.exe check_db.py
```

## Démarrer l'application

```bash
cd backend
.\venv\Scripts\python.exe -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```

## Notes importantes

- Assurez-vous que MySQL est démarré avant de lancer l'application
- L'utilisateur MySQL doit avoir les droits de création de base de données
- Les tables sont créées automatiquement au premier démarrage





