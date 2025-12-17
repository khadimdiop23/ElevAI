"""
Script de démarrage pour l'API ElevAI
"""

import sys
import os
from pathlib import Path

# Ajouter le répertoire parent au PYTHONPATH
backend_dir = Path(__file__).parent
parent_dir = backend_dir.parent
sys.path.insert(0, str(parent_dir))

import uvicorn

if __name__ == "__main__":
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)




