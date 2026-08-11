import pandas as pd
import sqlite3
from pathlib import Path
import math

excel_path = Path(__file__).parent / "data" / "data.xlsx"
db_path = Path(__file__).parent / "data" / "pso_outlets.db"

print("excel exists", excel_path.exists())
print("db exists", db_path.exists())

df = pd.read_excel(excel_path, sheet_name=0)
print("columns", df.columns.tolist())

df['Latitude_clean'] = (
    df['Latitude'].astype(str)
    .str.replace('\u00A0', ' ', regex=False)
    .str.strip()
    .str.replace(r'\s+', '', regex=True)
)
df['Longitude_clean'] = (
    df['Longitude'].astype(str)
    .str.replace('\u00A0', ' ', regex=False)
    .str.strip()
    .str.replace(r'\s+', '', regex=True)
)

df['Latitude_num'] = pd.to_numeric(df['Latitude_clean'], errors='coerce')
df['Longitude_num'] = pd.to_numeric(df['Longitude_clean'], errors='coerce')

invalid = df[df['Latitude_num'].isna() | df['Longitude_num'].isna()][['S.No','CODE NO','Latitude','Longitude','Latitude_clean','Longitude_clean']]
print('\nInvalid Excel coordinate rows:', len(invalid))
print(invalid.head(20).to_string(index=False))

mismatches = []
conn = sqlite3.connect(db_path)
cur = conn.cursor()
for _, row in df.iterrows():
    code = row['CODE NO']
    if pd.isna(code):
        continue
    code_int = int(''.join(ch for ch in str(code) if ch.isdigit()))
    cur.execute('SELECT latitude, longitude, name_of_outlets, city FROM outlets WHERE code_no = ?', (code_int,))
    db_row = cur.fetchone()
    if not db_row:
        continue
    db_lat, db_lon, name, city = db_row
    xlat, xlon = row['Latitude_num'], row['Longitude_num']
    if pd.isna(xlat) or pd.isna(xlon):
        continue
    if db_lat is None or db_lon is None:
        mismatches.append((code_int, name, city, xlat, xlon, db_lat, db_lon, row['Latitude'], row['Longitude']))
        continue
    if not (math.isclose(db_lat, xlat, rel_tol=1e-9, abs_tol=1e-9) and math.isclose(db_lon, xlon, rel_tol=1e-9, abs_tol=1e-9)):
        mismatches.append((code_int, name, city, xlat, xlon, db_lat, db_lon, row['Latitude'], row['Longitude']))
conn.close()

print('\nCoordinate mismatches:', len(mismatches))
for m in mismatches[:20]:
    print(m)