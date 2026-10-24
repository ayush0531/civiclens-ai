import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy import text

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.routers import (
    auth, reports, analysis, assignments, map as map_router,
    analytics, admin, audit
)
from backend.app.services.ai_service import ai_service
from backend.app.utils.seed_data import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed if database is empty
    db = SessionLocal()
    try:
        from backend.app.models.models import User
        if db.query(User).count() == 0:
            print("[CivicLens AI] Database is empty. Seeding synthetic Nagpur demo data...")
            stats = seed_database(db=db, force=False)
            print(f"[CivicLens AI] Seeding complete: {stats}")
        else:
            print("[CivicLens AI] Database already contains records. Ready.")
    except Exception as e:
        print(f"[CivicLens AI] Auto-seed check notice: {e}")
    finally:
        db.close()
    
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static File Uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount frontend production assets if built
frontend_dist_dir = os.path.join(settings.BASE_DIR, "frontend", "dist")
frontend_assets_dir = os.path.join(frontend_dist_dir, "assets")
if os.path.exists(frontend_assets_dir):
    app.mount("/assets", StaticFiles(directory=frontend_assets_dir), name="assets")

# Health check endpoint
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    db_status = "UNKNOWN"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_status = "CONNECTED"
    except Exception as e:
        db_status = f"ERROR: {str(e)}"

    engine_info = ai_service.get_engine_info()

    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "ai_engine": engine_info,
        "server_time_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "disclaimer": "CivicLens AI is an engineering capstone prototype. AI outputs are decision-support heuristics."
    }

# Register all API routers under /api/v1
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(analysis.router, prefix=settings.API_V1_PREFIX)
app.include_router(assignments.router, prefix=settings.API_V1_PREFIX)
app.include_router(map_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)
app.include_router(audit.router, prefix=settings.API_V1_PREFIX)

from fastapi.responses import JSONResponse, FileResponse

@app.get("/{full_path:path}", tags=["Root"])
def serve_spa_or_root(full_path: str):
    if full_path.startswith("api") or full_path.startswith("uploads"):
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    
    dist_dir = os.path.join(settings.BASE_DIR, "frontend", "dist")
    target_file = os.path.join(dist_dir, full_path)
    if os.path.isfile(target_file):
        return FileResponse(target_file)
    
    index_file = os.path.join(dist_dir, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
        
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "documentation": "/docs",
        "api_v1": settings.API_V1_PREFIX
    }
