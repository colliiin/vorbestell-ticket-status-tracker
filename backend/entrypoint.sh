#!/bin/sh
set -e
python -m app.cli.prepare_migrations
alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port 8000