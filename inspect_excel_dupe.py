import pandas as pd
from pathlib import Path
path = Path("backend/data/data.xlsx")
xl = pd.ExcelFile(path)
print("exists", path.exists())
print("sheets:", xl.sheet_names)
df = xl.parse(xl.sheet_names[0])
df.columns = [c.strip() for c in df.columns]
print("rows", len(df))
print("columns:", list(df.columns))
candidates = ["CODE NO", "Merchant ID (MID)", "NAME OF OUTLETS", "LOCATION"]
for col in candidates:
    if col in df.columns:
        print(f"\ncol={col}")
        print(" unique", df[col].nunique(dropna=False), "dup count", len(df) - df[col].nunique(dropna=False))
        if df[col].dtype == object:
            print(" top 5 values:")
            print(df[col].value_counts(dropna=False).head(5))
for subset in [["CODE NO"], ["Merchant ID (MID)"], ["CODE NO","Merchant ID (MID)"], ["NAME OF OUTLETS","CITY","DISTRICT"]]:
    subset_cols = [c for c in subset if c in df.columns]
    if subset_cols:
        dupe = df.duplicated(subset=subset_cols, keep=False)
        print(f"\nduplicate rows by {subset_cols}: {dupe.sum()}")
        if dupe.sum()>0:
            print(df.loc[dupe, subset_cols + ['S.No']].head(10).to_string(index=False))
print("\nMissing counts by col:")
for col in ["Latitude","Longitude","COCO SITE"]:
    if col in df.columns:
        print(col, df[col].isna().sum())
print("\nNormalized keys suggestion:")
print({c: c.lower().replace(' ','_').replace('(','').replace(')','').replace('/','_').replace('-','_') for c in df.columns})
