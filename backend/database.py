import os
import shutil
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG_DB_PATH = os.path.join(BASE_DIR, "duolingo.db")

# On Vercel or read-only serverless filesystems, copy duolingo.db to /tmp
if os.environ.get("VERCEL") or (os.path.exists("/tmp") and not os.access(BASE_DIR, os.W_OK)):
    TMP_DB_PATH = "/tmp/duolingo.db"
    if os.path.exists(ORIG_DB_PATH) and not os.path.exists(TMP_DB_PATH):
        try:
            shutil.copy2(ORIG_DB_PATH, TMP_DB_PATH)
        except Exception as e:
            print("Could not copy db to /tmp:", e)
    DB_PATH = TMP_DB_PATH
else:
    DB_PATH = ORIG_DB_PATH

SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
