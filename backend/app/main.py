import difflib
import logging
import os
import re
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.responses import JSONResponse

from .db import get_connection, row_to_dict
from .models import Station
from .utils import haversine_distance

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def _parse_allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "").strip()
    if not raw:
        return ["*"]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


ALLOWED_ORIGINS = _parse_allowed_origins()
ALLOW_CREDENTIALS = os.getenv("CORS_ALLOW_CREDENTIALS", "false").strip().lower() == "true"

app = FastAPI(title="PSO Petrol Station Locator API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_path = Path(__file__).resolve().parents[1] / "static"
app.mount("/static", StaticFiles(directory=static_path), name="static")

CITY_SEARCH_ALIASES = {
    "GWADAR": "GWADER",
    "GWADER": "GWADER",
    "RAHIMYARKHAN": "RAHIM YAR KHAN",
    "RAHIMYAR KHAN": "RAHIM YAR KHAN",
    "RADIM YARKHAN": "RAHIM YAR KHAN",
    "DIST RAHIMYAR KHAN": "RAHIM YAR KHAN",
    "ROHRI": "ROHRI",
    "SUKKUR": "SUKKUR",
    "KARACHI": "KARACHI",
}

city_lookup: list[str] = []


class FeedbackSubmission(BaseModel):
    station_id: int | None = None
    station_name: str | None = None
    issue_type: str
    message: str
    contact: str | None = None


@app.get("/health")
def health_check():
    return {"status": "ok"}


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    cleaned = re.sub(r"\s+", " ", value.strip())
    return cleaned.upper()


def get_close_city_match(search: str) -> str | None:
    normalized = normalize_text(search)
    if normalized in CITY_SEARCH_ALIASES:
        return CITY_SEARCH_ALIASES[normalized]
    if not city_lookup:
        return None
    matches = difflib.get_close_matches(normalized, city_lookup, n=1, cutoff=0.8)
    return matches[0] if matches else None


@app.on_event("startup")
def startup_event() -> None:
    global city_lookup
    with get_connection() as conn:
        cursor = conn.execute("SELECT COUNT(*) AS total FROM outlets")
        total_count = cursor.fetchone()[0]
        cursor = conn.execute("SELECT COUNT(DISTINCT city) AS unique_cities FROM outlets")
        unique_cities = cursor.fetchone()[0]
        cursor = conn.execute("SELECT DISTINCT city FROM outlets WHERE city IS NOT NULL")
        city_lookup = [normalize_text(row[0]) for row in cursor.fetchall() if row[0]]
    logging.info("Database loaded: %s stations across %s unique cities", total_count, unique_cities)


    with get_connection() as conn:
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


@app.post("/api/feedback")
def submit_feedback(feedback: FeedbackSubmission):
    if not feedback.message.strip():
        raise HTTPException(status_code=400, detail="Feedback message is required")

    with get_connection() as conn:
        conn.execute(
            "INSERT INTO feedback (station_id, station_name, issue_type, message, contact, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (
                feedback.station_id,
                feedback.station_name,
                feedback.issue_type,
                feedback.message.strip(),
                feedback.contact.strip() if feedback.contact else None,
                datetime.utcnow().isoformat() + "Z",
            ),
        )
        conn.commit()

    logging.info(
        "Feedback submitted station_id=%s station_name=%r issue_type=%s",
        feedback.station_id,
        feedback.station_name,
        feedback.issue_type,
    )
    return {"status": "success"}


@app.exception_handler(FileNotFoundError)
async def file_not_found_exception_handler(request: Request, exc: FileNotFoundError):
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Let HTTPException be handled by FastAPI default handler
    if isinstance(exc, HTTPException):
        raise exc
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/api/stations", response_model=list[Station])
def read_stations(
    search: str | None = Query(None, description="Text search for city, outlet name, district, province, or location"),
    filter: str | None = Query(None, description="Station filter: all, enabled, disabled"),
    user_lat: float | None = Query(None, description="User latitude for nearest sorting"),
    user_lon: float | None = Query(None, description="User longitude for nearest sorting"),
    nearest: int | None = Query(None, description="Return only the N nearest stations"),
    limit: int | None = Query(None, ge=1, le=1000, description="Maximum number of returned stations"),
):
    query = "SELECT * FROM outlets"
    where_clauses: list[str] = []
    parameters: list[object] = []

    normalized_search = normalize_text(search)
    if search:
        city_alias = CITY_SEARCH_ALIASES.get(normalized_search)
        if city_alias:
            search = city_alias
            normalized_search = normalize_text(search)

        clause = " OR ".join(
            [
                "LOWER(city) LIKE ?",
                "LOWER(name_of_outlets) LIKE ?",
                "LOWER(district) LIKE ?",
                "LOWER(province) LIKE ?",
                "LOWER(location) LIKE ?",
            ]
        )
        where_clauses.append(f"({clause})")
        search_term = f"%{search.strip().lower()}%"
        parameters.extend([search_term] * 5)

    if filter == "enabled":
        where_clauses.append("LOWER(COALESCE(pso_cards_enabled, '')) = 'y'")
    elif filter == "disabled":
        where_clauses.append("LOWER(COALESCE(pso_cards_enabled, '')) != 'y'")

    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)

    query += " ORDER BY name_of_outlets COLLATE NOCASE"

    with get_connection() as conn:
        cursor = conn.execute(query, parameters)
        rows = [row_to_dict(row) for row in cursor.fetchall()]

        if search and not rows:
            close_city = get_close_city_match(search)
            if close_city:
                logging.info("Fallback city match: %s -> %s", search, close_city)
                city_query = "SELECT * FROM outlets WHERE UPPER(TRIM(city)) = ? ORDER BY name_of_outlets COLLATE NOCASE"
                cursor = conn.execute(city_query, (close_city,))
                rows = [row_to_dict(row) for row in cursor.fetchall()]

    stations = []
    for row in rows:
        if "octane_status" not in row and row.get("r95_facility") is not None:
            row["octane_status"] = row["r95_facility"]
        station = Station(**row)
        if user_lat is not None and user_lon is not None and station.latitude is not None and station.longitude is not None:
            station.distance_km = round(haversine_distance(user_lat, user_lon, station.latitude, station.longitude), 2)
        stations.append(station)

    if user_lat is not None and user_lon is not None:
        stations = sorted(stations, key=lambda item: item.distance_km if item.distance_km is not None else float("inf"))

    if nearest is not None and nearest > 0:
        stations = stations[:nearest]

    if limit is not None:
        stations = stations[:limit]

    logging.info(
        "API request search=%r filter=%r nearest=%r limit=%r returned=%s",
        search,
        filter,
        nearest,
        limit,
        len(stations),
    )

    return stations
