from pathlib import Path
import sqlite3

DB_PATH = Path(__file__).resolve().parent / "backend" / "data" / "pso_outlets.db"

SQL_QUERIES = {
    "total_stations": "SELECT COUNT(*) FROM outlets;",
    "unique_cities": "SELECT COUNT(DISTINCT city) FROM outlets;",
    "cities": "SELECT DISTINCT city FROM outlets WHERE city IS NOT NULL AND city != '' ORDER BY city COLLATE NOCASE;",
    "missing_latitude": "SELECT id, name_of_outlets, city, district, province, pso_cards_enabled FROM outlets WHERE latitude IS NULL OR TRIM(latitude) = '' ORDER BY city COLLATE NOCASE, name_of_outlets COLLATE NOCASE;",
    "missing_longitude": "SELECT id, name_of_outlets, city, district, province, pso_cards_enabled FROM outlets WHERE longitude IS NULL OR TRIM(longitude) = '' ORDER BY city COLLATE NOCASE, name_of_outlets COLLATE NOCASE;",
    "duplicate_code_no": "SELECT code_no, COUNT(*) AS count FROM outlets WHERE code_no IS NOT NULL GROUP BY code_no HAVING count > 1 ORDER BY count DESC, code_no;",
}


def get_connection(path: Path) -> sqlite3.Connection:
    if not path.exists():
        raise FileNotFoundError(f"Database file not found: {path}")
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    return connection


def run_diagnostics(path: Path) -> None:
    print(f"Checking database: {path}\n")
    with get_connection(path) as conn:
        cursor = conn.cursor()

        cursor.execute(SQL_QUERIES["total_stations"])
        total_stations = cursor.fetchone()[0]
        print(f"Total stations: {total_stations}")

        cursor.execute(SQL_QUERIES["unique_cities"])
        unique_cities = cursor.fetchone()[0]
        print(f"Total unique cities: {unique_cities}\n")

        cursor.execute(SQL_QUERIES["cities"])
        cities = [row[0] for row in cursor.fetchall()]
        print("All cities:")
        if cities:
            for city in cities:
                print(f"- {city}")
        else:
            print("(no cities found)")
        print()

        cursor.execute(SQL_QUERIES["missing_latitude"])
        missing_lat = cursor.fetchall()
        print(f"Stations without latitude: {len(missing_lat)}")
        for row in missing_lat:
            print(f"- id={row['id']} name={row['name_of_outlets']!r} city={row['city']!r} district={row['district']!r} province={row['province']!r} status={row['pso_cards_enabled']!r}")
        print()

        cursor.execute(SQL_QUERIES["missing_longitude"])
        missing_lon = cursor.fetchall()
        print(f"Stations without longitude: {len(missing_lon)}")
        for row in missing_lon:
            print(f"- id={row['id']} name={row['name_of_outlets']!r} city={row['city']!r} district={row['district']!r} province={row['province']!r} status={row['pso_cards_enabled']!r}")
        print()

        cursor.execute(SQL_QUERIES["duplicate_code_no"])
        duplicates = cursor.fetchall()
        print(f"Duplicate outlet codes: {len(duplicates)}")
        for row in duplicates:
            print(f"- code_no={row['code_no']} count={row['count']}")


if __name__ == "__main__":
    try:
        run_diagnostics(DB_PATH)
    except Exception as error:
        print(f"Error: {error}")
