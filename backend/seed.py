import sys
import os

# Add root directory to python path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.app.database import engine, Base, SessionLocal
from backend.app.utils.seed_data import seed_database

def main():
    print("==============================================================")
    print(" CivicLens AI — Nagpur Road Damage Demonstration Seeder")
    print("==============================================================")
    print("Initializing SQLite database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        force = "--force" in sys.argv
        print(f"Executing database seed (force={force})...")
        result = seed_database(db=db, force=force)
        print("\nSeeding Summary:")
        for k, v in result.items():
            print(f"  • {k}: {v}")
        print("\nStandard Demo Accounts:")
        print("  • Citizen:    citizen@civiclens.ai   / DemoPass123!")
        print("  • Authority:  authority@civiclens.ai / DemoPass123!")
        print("  • Admin:      admin@civiclens.ai     / DemoPass123!")
        print("  • Field Crew: engineer@civiclens.ai  / DemoPass123!")
        print("==============================================================")
    finally:
        db.close()

if __name__ == "__main__":
    main()
