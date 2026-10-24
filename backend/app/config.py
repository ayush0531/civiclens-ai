import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicLens AI"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Intelligent Road Damage Detection and Maintenance Prioritization System"
    API_V1_PREFIX: str = "/api/v1"
    
    BASE_DIR: str = str(PROJECT_ROOT)
    
    # Database
    DATABASE_URL: str = f"sqlite:///{PROJECT_ROOT}/civiclens.db"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "civiclens_btech_capstone_secure_jwt_secret_key_2025")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Uploads
    UPLOAD_DIR: str = str(PROJECT_ROOT / "uploads")
    STATIC_DIR: str = str(PROJECT_ROOT / "static")
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # AI Engine Configuration ("REAL" for ONNX model or "DEMO" for heuristic fallback)
    AI_INFERENCE_MODE: str = os.getenv("AI_INFERENCE_MODE", "REAL")
    AI_MODEL_NAME: str = "CivicLens-YOLOv8-RDD2022 (ONNX Deep Learning Engine)"
    AI_MODEL_VERSION: str = "2.0.0"
    AI_ONNX_MODEL_PATH: str = str(PROJECT_ROOT / "models" / "road_damage_yolo.onnx")
    
    # Priority Engine Weights (Explainable multicriteria formula - 6 factors)
    WEIGHT_SEVERITY: float = 0.35
    WEIGHT_CONFIDENCE: float = 0.15
    WEIGHT_DUPLICATES: float = 0.15
    WEIGHT_AGING: float = 0.15
    WEIGHT_ROAD_CLASS: float = 0.10
    WEIGHT_TRAFFIC_SAFETY: float = 0.10
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.STATIC_DIR, exist_ok=True)
