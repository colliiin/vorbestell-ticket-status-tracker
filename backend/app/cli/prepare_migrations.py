from sqlalchemy import inspect, text
from app.database import engine

def main():
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if "tickets" in tables and "alembic_version" not in tables:
        with engine.begin() as conn:
            conn.execute(text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)"))
            conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('0001_initial')"))
        print("Existing MVP schema detected; stamped Alembic revision 0001_initial")

if __name__ == "__main__":
    main()