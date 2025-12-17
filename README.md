# ElevAI - Coach numérique intelligent de bien-être

Application full-stack pour le suivi du bien-être avec intégration d'IA, permettant aux utilisateurs de suivre leurs indicateurs quotidiens (sommeil, activité physique, alimentation, humeur, stress, fréquence cardiaque), de calculer un score de bien-être, de prédire son évolution et de recevoir des recommandations personnalisées.

##  Table des matières

- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Endpoints API](#endpoints-api)
- [Modèle IA](#modèle-ia)
- [Tests](#tests)
- [Structure du projet](#structure-du-projet)

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │  React + Chart.js
│  (Port 3000)│
└──────┬──────┘
       │ HTTP/REST
       │
┌──────▼──────┐
│   Backend   │  FastAPI + SQLite
│  (Port 8000)│
└──────┬──────┘
       │
┌──────▼──────┐
│   Base de   │  SQLite
│  données    │
└─────────────┘
       │
┌──────▼──────┐
│   Module ML │  scikit-learn (RandomForest)
│  (model.pkl)│
└─────────────┘
```

### Technologies utilisées

- **Backend**: FastAPI, SQLite, scikit-learn, pandas, numpy
- **Frontend**: React, React Router, Chart.js, Axios
- **Tests**: Playwright
- **IA**: RandomForest Regressor pour la prédiction du score de bien-être

## Prérequis

- Python 3.8+
- Node.js 16+
- npm ou yarn

##  Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-depot>
cd ElevAI
```

### 2. Backend

```bash
cd backend

# Créer un environnement virtuel (recommandé)
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows:
venv\Scripts\activate
# Sur Linux/Mac:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Initialiser la base de données (automatique au démarrage)
# Optionnel: Entraîner le modèle ML
python -m ml.train
```

### 3. Frontend

```bash
cd frontend

# Installer les dépendances
npm install
```

### 4. Tests

```bash
cd tests

# Installer les dépendances
npm install

# Installer les navigateurs Playwright
npx playwright install
```

## Utilisation

### Démarrer le backend

```bash
cd backend
python -m uvicorn app:app --reload --port 8000
```

Le serveur API sera accessible sur `http://localhost:8000`
Documentation interactive disponible sur `http://localhost:8000/docs`

### Démarrer le frontend

```bash
cd frontend
npm start
```

L'application sera accessible sur `http://localhost:3000`

### Exécuter les tests E2E

```bash
cd tests
npm test
```

Pour l'interface UI de Playwright:
```bash
npm run test:ui
```

##  Endpoints API

### Utilisateurs

#### `POST /users`
Créer un nouveau profil utilisateur

**Body:**
```json
{
  "age": 28,
  "genre": "M",
  "taille_cm": 178,
  "poids_kg": 74,
  "objectif": "Améliorer le sommeil"
}
```

**Réponse:**
```json
{
  "id": 1,
  "age": 28,
  "genre": "M",
  "taille_cm": 178,
  "poids_kg": 74,
  "objectif": "Améliorer le sommeil",
  "created_at": "2025-11-17T10:00:00"
}
```

#### `GET /users/{user_id}`
Récupérer un utilisateur par son ID

#### `GET /users`
Liste tous les utilisateurs

### Données quotidiennes

#### `POST /data`
Ajouter un enregistrement quotidien

**Body:**
```json
{
  "user_id": 1,
  "date": "2025-11-10",
  "sommeil_h": 7.2,
  "pas": 8650,
  "sport_min": 35,
  "calories": 2200,
  "humeur_0_5": 4,
  "stress_0_5": 2,
  "fc_repos": 60
}
```

#### `GET /data/{user_id}?from=2025-11-01&to=2025-11-30`
Récupérer l'historique avec filtres optionnels

### Analyse

#### `GET /analyze/{user_id}`
Calculer le score global et l'analyse courante

**Réponse:**
```json
{
  "score": 81,
  "category": "Bon équilibre",
  "risk_prediction": "Stress en hausse probable sur 3 jours",
  "explanations": {
    "sommeil_h": "+",
    "sport_min": "+",
    "stress_0_5": "-"
  },
  "recommendations": [
    "Avance ton coucher de 30 minutes pendant 3 jours",
    "Marche 20 minutes après le déjeuner",
    "Hydratation : objectif 2 L/j"
  ]
}
```

#### `GET /recommend/{user_id}`
Obtenir les recommandations personnalisées

##  Modèle IA

### Choix du modèle

Le projet utilise un **RandomForest Regressor** pour prédire le score de bien-être (0-100).

**Pourquoi RandomForest ?**
- Gère bien les valeurs manquantes
- Non-linéaire, capture les interactions entre features
- Interprétable (feature importance)
- Robuste aux outliers

**Alternatives envisagées:**
- Régression linéaire/ElasticNet : trop simple pour des relations non-linéaires
- Gradient Boosting : plus complexe, risque de sur-apprentissage avec peu de données
- KMeans (non supervisé) : moins adapté pour un score continu

### Prétraitement

1. **Normalisation des features** :
   - Sommeil (0-24h) → normalisé 0-1 (optimal: 7-9h)
   - Pas (0-12000+) → normalisé 0-1 (optimal: 8000-12000)
   - Sport (0-90min+) → normalisé 0-1
   - Calories (0-3000+) → normalisé 0-1
   - Humeur (0-5) → normalisé 0-1
   - Stress (0-5) → inversé et normalisé (moins = mieux)
   - FC repos (30-200) → normalisé selon optimal (50-70)

2. **Moyenne mobile sur 3 jours** pour certaines features (sommeil, sport, stress)

3. **Gestion des valeurs manquantes** : imputation par valeurs par défaut réalistes

### Métriques d'évaluation

- **MSE (Mean Squared Error)** : erreur quadratique moyenne
- **R² Score** : coefficient de détermination (qualité du modèle)

### Reproductibilité

- `random_state=42` dans RandomForest
- Seeds fixes pour la génération de données synthétiques
- Versioning des dépendances dans `requirements.txt`

### Entraînement

```bash
cd backend
python -m ml.train
```

Le modèle est sauvegardé dans `backend/ml/model.pkl` et chargé automatiquement lors des prédictions.

##  Tests

### Tests E2E Playwright

Les tests couvrent les scénarios suivants:

1. **T1**: Création d'un utilisateur → redirection profil/dashboard
2. **T2**: Ajout d'une journée de données → présence dans l'historique
3. **T3**: Appel de l'analyse → affichage du score et des recommandations
4. **T4**: Vérification que le graphe d'évolution se met à jour après ajout d'une nouvelle journée

### Exécution

```bash
cd tests
npm test
```

##  Structure du projet

```
ElevAI/
├── backend/
│   ├── app.py                 # Application FastAPI principale
│   ├── database.py            # Gestion de la base SQLite
│   ├── models.py              # Modèles Pydantic
│   ├── requirements.txt       # Dépendances Python
│   ├── routers/
│   │   ├── users.py          # Routes utilisateurs
│   │   ├── data.py           # Routes données quotidiennes
│   │   ├── analysis.py       # Routes analyse
│   │   └── recommend.py      # Routes recommandations
│   └── ml/
│       ├── model.py          # Modèle ML et prédictions
│       └── train.py          # Script d'entraînement
│
├── frontend/
│   ├── src/
│   │   ├── App.js            # Composant principal avec routing
│   │   ├── App.css           # Styles globaux
│   │   ├── pages/
│   │   │   ├── Login.js      # Page de connexion/création
│   │   │   ├── Dashboard.js  # Dashboard avec graphiques
│   │   │   └── AddEntry.js   # Formulaire d'ajout de données
│   │   └── components/
│   │       ├── ScoreCard.js  # Carte affichant le score
│   │       └── RadarCard.js  # Graphique radar des dimensions
│   └── package.json
│
├── tests/
│   ├── e2e/
│   │   └── ElevAI.spec.ts   # Tests Playwright
│   ├── playwright.config.ts # Configuration Playwright
│   └── package.json
│
└── README.md
```

##  Sécurité (à considérer pour un déploiement public)

- [ ] Authentification JWT
- [ ] Validation et sanitization des entrées
- [ ] Rate limiting
- [ ] HTTPS
- [ ] Protection CSRF
- [ ] Gestion sécurisée des secrets
- [ ] Audit des dépendances

##  Fonctionnalités Frontend

- **Page de connexion** : Sélection ou création d'utilisateur
- **Dashboard** :
  - Score de bien-être avec catégorie
  - Graphique radar des dimensions
  - Graphique d'évolution du score (line chart)
  - Recommandations personnalisées
  - Explications par dimension
- **Formulaire d'ajout** : Validation des champs, messages d'erreur/succès

## Exemples d'usage

### Créer un utilisateur via curl

```bash
curl -X POST "http://localhost:8000/users" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 28,
    "genre": "M",
    "taille_cm": 178,
    "poids_kg": 74,
    "objectif": "Améliorer le sommeil"
  }'
```

### Ajouter des données

```bash
curl -X POST "http://localhost:8000/data" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "date": "2025-11-17",
    "sommeil_h": 7.5,
    "pas": 8500,
    "sport_min": 30,
    "calories": 2200,
    "humeur_0_5": 4,
    "stress_0_5": 2,
    "fc_repos": 65
  }'
```

### Obtenir l'analyse

```bash
curl "http://localhost:8000/analyze/1"
```

##  Dépannage

### Le backend ne démarre pas

- Vérifier que le port 8000 est libre
- Vérifier que toutes les dépendances sont installées
- Vérifier que Python 3.8+ est utilisé

### Le frontend ne se connecte pas à l'API

- Vérifier que le backend est démarré sur le port 8000
- Vérifier la configuration CORS dans `app.py`
- Vérifier l'URL de l'API dans les fichiers frontend (`API_URL`)

### Les tests Playwright échouent

- Vérifier que le backend et le frontend sont démarrés
- Vérifier que les navigateurs Playwright sont installés: `npx playwright install`
- Augmenter les timeouts si nécessaire dans `playwright.config.ts`

##  Notes de développement

- Le modèle ML utilise des données synthétiques si moins de 50 enregistrements réels sont disponibles
- La base de données SQLite est créée automatiquement au premier démarrage
- Le modèle est sauvegardé dans `backend/ml/model.pkl` après entraînement






