from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

# Normalize database URL for SQLAlchemy 2.0 (Render/PaaS often provides postgres://)
raw_db_url = settings.DATABASE_URL
if raw_db_url.startswith("postgres://"):
    resolved_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
else:
    resolved_db_url = raw_db_url

# SQLite connection arguments for concurrency and foreign keys
connect_args = {"check_same_thread": False} if resolved_db_url.startswith("sqlite") else {}

engine = create_engine(
    resolved_db_url,
    connect_args=connect_args,
    echo=False
)

# Enforce foreign key constraints and WAL mode in SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if resolved_db_url.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys=ON")
        except Exception:
            pass
        try:
            cursor.execute("PRAGMA journal_mode=WAL")
        except Exception:
            # Fallback for cloud-synced filesystems where WAL shared memory fails
            try:
                cursor.execute("PRAGMA journal_mode=DELETE")
            except Exception:
                pass
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def check_and_apply_migrations(eng: Engine):
    """
    Ensures newly declared columns are added to existing SQLite or PostgreSQL tables
    without dropping records or corrupting seeded demo data.
    """
    from sqlalchemy import inspect, text
    try:
        inspector = inspect(eng)
        if "road_damage_reports" in inspector.get_table_names():
            existing_cols = {col["name"] for col in inspector.get_columns("road_damage_reports")}
            cols_to_add = [
                ("landmark", "VARCHAR(200)"),
                ("area_locality", "VARCHAR(100) DEFAULT 'Nagpur Central'"),
                ("city", "VARCHAR(100) DEFAULT 'Nagpur'"),
                ("reporter_name", "VARCHAR(120)"),
                ("reporter_contact", "VARCHAR(100)"),
                ("incident_date", "DATETIME"),
                ("external_submission_status", "VARCHAR(60) DEFAULT 'DEMO_ENVIRONMENT'"),
                ("external_reference_id", "VARCHAR(100)"),
            ]
            with eng.connect() as conn:
                for col_name, col_type in cols_to_add:
                    if col_name not in existing_cols:
                        try:
                            conn.execute(text(f"ALTER TABLE road_damage_reports ADD COLUMN {col_name} {col_type}"))
                            conn.commit()
                            print(f"[CivicLens AI] Migrated column: {col_name}")
                        except Exception as e:
                            print(f"[CivicLens AI] Migration note for {col_name}: {e}")
    except Exception as e:
        print(f"[CivicLens AI] Schema inspection notice: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
