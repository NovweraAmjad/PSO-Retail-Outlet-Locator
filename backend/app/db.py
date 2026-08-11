import sqlite3
import os
from pathlib import Path
from typing import Dict, Any

_DEFAULT_DB_FILE = Path(__file__).resolve().parents[1] / "data" / "pso_outlets.db"
DB_FILE = Path(os.getenv("PSO_DB_FILE", str(_DEFAULT_DB_FILE))).expanduser()

OUTLET_COLUMNS = {
    "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
    "s_no": "INTEGER",
    "code_no": "INTEGER",
    "merchant_id_mid": "TEXT",
    "pso_cards_enabled": "TEXT",
    "shop_stop": "TEXT",
    "vibe": "TEXT",
    "alliances_qsr": "TEXT",
    "type": "TEXT",
    "coco_site": "TEXT",
    "latitude": "REAL",
    "longitude": "REAL",
    "zone": "TEXT",
    "pso_division": "TEXT",
    "name_of_outlets": "TEXT",
    "city": "TEXT",
    "district": "TEXT",
    "province": "TEXT",
    "location": "TEXT",
    "r95_facility": "TEXT",
    "octane_status": "TEXT",
}

CREATE_OUTLETS_SQL = f"""
CREATE TABLE IF NOT EXISTS outlets (
    {', '.join(f'{column} {definition}' for column, definition in OUTLET_COLUMNS.items())}
);
"""


def _ensure_db_exists(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        # Create an empty database with minimal schema so the app can start
        conn = sqlite3.connect(path)
        try:
            conn.execute(CREATE_OUTLETS_SQL)
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    station_id INTEGER,
                    station_name TEXT,
                    issue_type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    contact TEXT,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.commit()
        finally:
            conn.close()


def _ensure_outlet_schema(connection: sqlite3.Connection) -> None:
    connection.execute(CREATE_OUTLETS_SQL)
    existing_columns = {
        row[1]
        for row in connection.execute("PRAGMA table_info(outlets)").fetchall()
    }
    for column, definition in OUTLET_COLUMNS.items():
        if column == "id" or column in existing_columns:
            continue
        connection.execute(f"ALTER TABLE outlets ADD COLUMN {column} {definition}")
    connection.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_outlets_code_no ON outlets(code_no)")
    connection.commit()


def get_connection() -> sqlite3.Connection:
    try:
        if not DB_FILE.exists():
            _ensure_db_exists(DB_FILE)
        connection = sqlite3.connect(DB_FILE)
        connection.row_factory = sqlite3.Row
        _ensure_outlet_schema(connection)
        return connection
    except Exception:
        # As a last resort return an in-memory DB to avoid crashing the server
        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row
        return conn


def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return {key: row[key] for key in row.keys()}
