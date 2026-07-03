import argparse
import getpass
from sqlalchemy import select
from app.database import SessionLocal
from app.models import User, UserRole
from app.security.passwords import hash_password

def main():
    parser = argparse.ArgumentParser(description="Create initial owner/admin user")
    parser.add_argument("--username", required=True)
    parser.add_argument("--role", choices=["owner", "admin"], default="admin")
    parser.add_argument("--password")
    parser.add_argument("--ignore-existing", action="store_true", help="Exit successfully if the user already exists")
    args = parser.parse_args()
    password = args.password or getpass.getpass("Password: ")
    if len(password) < 10:
        raise SystemExit("Password must be at least 10 characters")
    db = SessionLocal()
    try:
        if db.scalar(select(User).where(User.username == args.username)):
            message = "User already exists; refusing to overwrite"
            if args.ignore_existing:
                print(message)
                return
            raise SystemExit(message)
        db.add(User(username=args.username, password_hash=hash_password(password), role=UserRole(args.role)))
        db.commit()
        print(f"Created {args.role} user: {args.username}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
