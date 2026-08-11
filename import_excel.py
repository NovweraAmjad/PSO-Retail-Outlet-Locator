import logging
import sqlite3
import re
from pathlib import Path

import pandas as pd

DATA_FILE = Path(__file__).parent / "backend" / "data" / "stationdata.xlsx"
DB_FILE = Path(__file__).parent / "backend" / "data" / "pso_outlets.db"

COLUMN_MAP = {
    "S.No": "s_no",
    "CODE NO": "code_no",
    "Merchant ID (MID)": "merchant_id_mid",
    "PSO Cards Enbaled (Y/N)": "pso_cards_enabled",
    "Shop Stop": "shop_stop",
    "VIBE": "vibe",
    "Alliances/QSR": "alliances_qsr",
    "Type": "type",
    "COCO SITE": "coco_site",
    "Latitude": "latitude",
    "Longitude": "longitude",
    "Zone": "zone",
    "PSO DIVISION": "pso_division",
    "NAME OF OUTLETS": "name_of_outlets",
    "CITY": "city",
    "CITY ": "city",
    "DISTRICT": "district",
    "Province": "province",
    "LOCATION": "location",
    "R-95 Facility": "r95_facility",
}

CITY_NORMALIZE_ALIASES = {
    "GWADER": "GWADAR",
    "RAHIMYARKHAN": "RAHIM YAR KHAN",
    "RAHIMYAR KHAN": "RAHIM YAR KHAN",
    "DIST RAHIMYAR KHAN": "RAHIM YAR KHAN",
    "HAFIZABAD": "HAFIZABAD",
    "KOHAT": "KOHAT",
    "ROHRI": "ROHRI",
    "SUKKUR": "SUKKUR",
}

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS outlets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    s_no INTEGER,
    code_no INTEGER UNIQUE,
    merchant_id_mid TEXT,
    pso_cards_enabled TEXT,
    shop_stop TEXT,
    vibe TEXT,
    alliances_qsr TEXT,
    type TEXT,
    coco_site TEXT,
    latitude REAL,
    longitude REAL,
    zone TEXT,
    pso_division TEXT,
    name_of_outlets TEXT,
    city TEXT,
    district TEXT,
    province TEXT,
    location TEXT,
    r95_facility TEXT,
    octane_status TEXT
);
"""

INSERT_COLUMNS = [
    "s_no",
    "code_no",
    "merchant_id_mid",
    "pso_cards_enabled",
    "shop_stop",
    "vibe",
    "alliances_qsr",
    "type",
    "coco_site",
    "latitude",
    "longitude",
    "zone",
    "pso_division",
    "name_of_outlets",
    "city",
    "district",
    "province",
    "location",
    "r95_facility",
    "octane_status",
]

UPSERT_SQL = f"""
INSERT INTO outlets ({', '.join(INSERT_COLUMNS)})
VALUES ({', '.join(['?'] * len(INSERT_COLUMNS))})
ON CONFLICT(code_no) DO UPDATE SET
{', '.join(f'{column}=excluded.{column}' for column in INSERT_COLUMNS if column != 'code_no')};
"""

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    renamed = {col: COLUMN_MAP.get(col.strip(), col.strip()) for col in df.columns}
    df = df.rename(columns=renamed)
    df = df.loc[:, list(dict.fromkeys(renamed.values()))]
    return df


def clean_text_columns(df: pd.DataFrame) -> pd.DataFrame:
    for col in df.select_dtypes(include=[object]).columns:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({"": None, "nan": None, "None": None})

    if "city" in df.columns:
        df["city"] = df["city"].astype(str).str.strip().str.upper()
        df["city"] = df["city"].replace(CITY_NORMALIZE_ALIASES)

    for text_col in ["district", "province"]:
        if text_col in df.columns:
            df[text_col] = df[text_col].astype(str).str.strip().str.upper()

    if "pso_cards_enabled" in df.columns:
        df["pso_cards_enabled"] = normalize_flag_series(df["pso_cards_enabled"])

    if "type" in df.columns:
        df["type"] = normalize_outlet_type_series(df["type"])

    if "coco_site" in df.columns:
        df["coco_site"] = normalize_coco_site_series(df["coco_site"])

    for flag_col in ["shop_stop", "vibe", "r95_facility"]:
        if flag_col in df.columns:
            df[flag_col] = normalize_flag_series(df[flag_col])

    if "octane_status" in df.columns:
        df["octane_status"] = normalize_flag_series(df["octane_status"])

    if "r95_facility" in df.columns and "octane_status" not in df.columns:
        df["octane_status"] = df["r95_facility"]
    return df


def normalize_flag_series(series: pd.Series) -> pd.Series:
    return (
        series.astype(str)
        .str.strip()
        .str.upper()
        .replace({
            "YES": "Y",
            "NO": "N",
            "TRUE": "Y",
            "FALSE": "N",
            "1": "Y",
            "0": "N",
            "Y": "Y",
            "N": "N",
            "NONE": None,
            "NAN": None,
            "": None,
        })
    )


def normalize_outlet_type_series(series: pd.Series) -> pd.Series:
    normalized = series.astype(str).str.strip().str.upper()
    normalized = normalized.replace({"NAN": None, "NONE": None, "": None})

    nv_mask = normalized.str.contains(r"\bNV\b|NEW\s*VISION", regex=True, na=False)
    ov_mask = normalized.str.contains(r"\bOV\b|OLD\s*VISION", regex=True, na=False)

    normalized = normalized.mask(nv_mask, "NV")
    normalized = normalized.mask(ov_mask, "OV")
    return normalized


def normalize_coco_site_series(series: pd.Series) -> pd.Series:
    normalized = series.astype(str).str.strip().str.upper()
    normalized = normalized.replace({"NAN": None, "NONE": None, "": None})

    coco_yes_map = {
        "COCO": "Y",
        "COCO SITE": "Y",
        "Y": "Y",
        "YES": "Y",
        "TRUE": "Y",
        "1": "Y",
    }
    coco_no_map = {
        "N": "N",
        "NO": "N",
        "FALSE": "N",
        "0": "N",
    }

    normalized = normalized.replace(coco_yes_map)
    normalized = normalized.replace(coco_no_map)
    return normalized


def clean_coordinate_value(value: object) -> object:
    if pd.isna(value):
        return None
    text = str(value).strip()
    if not text:
        return None
    text = text.replace("\xa0", "")
    text = text.replace("’", "").replace("‘", "").replace("′", "")
    text = text.replace(",", ".")
    text = re.sub(r"\s+", "", text)
    text = re.sub(r"[^0-9.\-]", "", text)
    return text or None


def validate_coordinate(series: pd.Series, min_value: float, max_value: float, name: str) -> pd.Series:
    cleaned = series.map(clean_coordinate_value)
    numeric = pd.to_numeric(cleaned, errors="coerce")
    invalid = ~numeric.between(min_value, max_value)
    if invalid.any():
        count = invalid.sum()
        logging.warning("%s: %s invalid values set to NULL", name, count)
        numeric.loc[invalid] = None
    return numeric


def load_and_clean_data(excel_path: Path) -> pd.DataFrame:
    if not excel_path.exists():
        raise FileNotFoundError(f"Excel file not found: {excel_path}")

    logging.info("Reading Excel file: %s", excel_path)
    df = pd.read_excel(excel_path, sheet_name=0)
    df = normalize_columns(df)
    df = clean_text_columns(df)

    if "latitude" in df.columns:
        df["latitude"] = validate_coordinate(df["latitude"], -90.0, 90.0, "Latitude")
    if "longitude" in df.columns:
        df["longitude"] = validate_coordinate(df["longitude"], -180.0, 180.0, "Longitude")

    if "octane_status" not in df.columns and "r95_facility" in df.columns:
        df["octane_status"] = df["r95_facility"]

    return df


def ensure_database_schema(connection: sqlite3.Connection) -> None:
    connection.execute(CREATE_TABLE_SQL)

    existing_columns = {
        row[1]
        for row in connection.execute("PRAGMA table_info(outlets)").fetchall()
    }

    column_types = {
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

    for column, column_type in column_types.items():
        if column not in existing_columns:
            connection.execute(f"ALTER TABLE outlets ADD COLUMN {column} {column_type}")

    connection.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_outlets_code_no ON outlets(code_no)")
    connection.commit()


def create_database(db_path: Path) -> sqlite3.Connection:
    logging.info("Creating SQLite database: %s", db_path)
    connection = sqlite3.connect(db_path)
    ensure_database_schema(connection)
    return connection


def insert_records(connection: sqlite3.Connection, df: pd.DataFrame) -> int:
    rows = []
    for _, row in df.iterrows():
        values = [row.get(col) for col in INSERT_COLUMNS]
        rows.append(values)

    cursor = connection.cursor()
    cursor.executemany(UPSERT_SQL, rows)
    connection.commit()
    inserted = cursor.rowcount
    logging.info("Inserted or updated %s records.", inserted)
    return inserted


def main() -> None:
    df = load_and_clean_data(DATA_FILE)
    logging.info("Loaded %s rows and %s columns.", df.shape[0], df.shape[1])

    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    with create_database(DB_FILE) as conn:
        inserted = insert_records(conn, df)

    logging.info("Database import complete.")
    logging.info("Database file: %s", DB_FILE)
    logging.info("Total records processed: %s", df.shape[0])
    logging.info("Total records inserted/updated: %s", inserted)


if __name__ == "__main__":
    main()
