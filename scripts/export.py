"""
Export all configuration data from the report_service database to export.dat.

Output format: plain SQL — TRUNCATE + INSERT statements, in FK-safe order:
  datasources → users → reports

Usage (from repo root, with venv active):
  python scripts/export.py                        # reads .env from publish/.env or backend/.env
  python scripts/export.py --env path/to/.env     # explicit .env file
  python scripts/export.py --out path/to/out.dat  # explicit output file
  python scripts/export.py --url "postgresql://report:report@localhost:5432/report_service"

Re-import:
  psql -d report_service -f export.dat
"""

import argparse
import asyncio
import json
import os
import re
import sys
from datetime import datetime, date
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# .env loader (no python-dotenv dependency)
# ---------------------------------------------------------------------------

def load_env_file(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    try:
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            env[key] = value
    except FileNotFoundError:
        pass
    return env


def resolve_database_url(explicit_url: str | None, explicit_env: str | None) -> str:
    if explicit_url:
        return explicit_url

    repo_root = Path(__file__).resolve().parent.parent

    # Candidates: explicit path, publish/.env, backend/.env
    candidates: list[Path] = []
    if explicit_env:
        candidates.append(Path(explicit_env))
    candidates += [
        repo_root / "publish" / ".env",
        repo_root / "backend" / ".env",
    ]

    env: dict[str, str] = {}
    for path in candidates:
        env = load_env_file(path)
        if "DATABASE_URL" in env:
            break

    url = env.get("DATABASE_URL") or os.environ.get("DATABASE_URL", "")
    if not url:
        sys.exit(
            "ERROR: DATABASE_URL not found.\n"
            "Pass --url, --env, or set DATABASE_URL in the environment."
        )
    return url


def to_asyncpg_url(url: str) -> str:
    """Strip '+asyncpg' or '+psycopg2' dialect suffixes so asyncpg accepts the URL."""
    return re.sub(r"\+\w+", "", url, count=1)


# ---------------------------------------------------------------------------
# SQL value escaping
# ---------------------------------------------------------------------------

def sql_literal(value: Any) -> str:
    """Convert a Python value to a safe SQL literal."""
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, int | float):
        return str(value)
    if isinstance(value, (datetime, date)):
        return f"'{value.isoformat()}'"
    if isinstance(value, dict | list):
        # JSONB columns
        escaped = json.dumps(value, ensure_ascii=False).replace("'", "''")
        return f"'{escaped}'"
    # str, UUID, and everything else — stringify and escape single quotes
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"


def build_insert(table: str, columns: list[str], rows: list[dict]) -> list[str]:
    stmts: list[str] = []
    col_list = ", ".join(columns)
    for row in rows:
        values = ", ".join(sql_literal(row[col]) for col in columns)
        stmts.append(f"INSERT INTO {table} ({col_list}) VALUES ({values});")
    return stmts


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

# Tables exported in FK-safe order (datasources before reports)
TABLES = [
    "datasources",
    "users",
    "reports",
]

# Explicit column order per table (matches model definitions exactly)
COLUMNS: dict[str, list[str]] = {
    "users": ["id", "username", "password_hash", "role", "is_active", "created_at"],
    "datasources": ["id", "name", "host", "port", "database", "username",
                    "password_encrypted", "is_active", "created_at", "updated_at"],
    "reports": ["id", "slug", "name", "description", "group", "type",
                "datasource_id", "sql_query", "config", "is_active",
                "created_at", "updated_at"],
}


async def export(db_url: str, out_path: Path) -> None:
    import asyncpg  # noqa: PLC0415

    print(f"Connecting to database…")
    conn = await asyncpg.connect(db_url)

    try:
        lines: list[str] = []

        lines += [
            "-- export.dat",
            f"-- Generated: {datetime.utcnow().isoformat(timespec='seconds')}Z",
            f"-- Source:    {re.sub(r':([^/@]+)@', ':***@', db_url)}",
            "--",
            "-- Re-import: psql -d report_service -f export.dat",
            "--",
            "BEGIN;",
            "",
        ]

        for table in TABLES:
            columns = COLUMNS[table]
            col_list_sql = ", ".join(f'"{c}"' for c in columns)
            raw_rows = await conn.fetch(
                f'SELECT {col_list_sql} FROM "{table}" ORDER BY created_at'
            )

            # Convert asyncpg Record objects to plain dicts
            rows = [dict(r) for r in raw_rows]

            lines += [
                f"-- ============================================================",
                f"-- {table}  ({len(rows)} rows)",
                f"-- ============================================================",
                f'TRUNCATE TABLE "{table}" CASCADE;',
            ]

            if rows:
                col_list = ", ".join(f'"{c}"' for c in columns)
                for row in rows:
                    values = ", ".join(sql_literal(row[col]) for col in columns)
                    lines.append(f'INSERT INTO "{table}" ({col_list}) VALUES ({values});')

            lines.append("")

        lines += ["COMMIT;", ""]

        out_path.write_text("\n".join(lines), encoding="utf-8")
        print(f"Exported {sum(1 for l in lines if l.startswith('INSERT')) } rows → {out_path}")

    finally:
        await conn.close()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent

    parser = argparse.ArgumentParser(description="Export report_service DB to SQL file.")
    parser.add_argument("--url", help="PostgreSQL connection URL (overrides .env)")
    parser.add_argument("--env", help="Path to .env file")
    parser.add_argument(
        "--out",
        default=str(repo_root / "export.dat"),
        help="Output file path (default: <repo-root>/export.dat)",
    )
    args = parser.parse_args()

    raw_url = resolve_database_url(args.url, args.env)
    db_url = to_asyncpg_url(raw_url)
    out_path = Path(args.out)

    asyncio.run(export(db_url, out_path))


if __name__ == "__main__":
    main()
