from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.routers import users, data, analysis

# Initialiser la base de données
init_db()

app = FastAPI(
    title="ElevAI API",
    description="API pour le suivi du bien-être avec IA",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users.router)
app.include_router(data.router)
app.include_router(analysis.router)

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API ElevAI", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
