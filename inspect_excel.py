import pandas as pd
from pathlib import Path
path = Path('backend/data/data.xlsx')
print('exists', path.exists())
xl = pd.ExcelFile(path)
print('sheets:', xl.sheet_names)
for sheet in xl.sheet_names:
    df = xl.parse(sheet)
    print('\nSHEET:', sheet)
    print('shape:', df.shape)
    print('columns:', list(df.columns))
    print('dtypes:')
    print(df.dtypes)
    print('missing per col:')
    print(df.isna().sum())
    if any(str(c).strip().lower() == 'outlet' for c in df.columns):
        cols = [c for c in df.columns if str(c).strip().lower() == 'outlet']
        for c in cols:
            dups = df.duplicated(subset=[c]).sum()
            print(f"duplicate outlet values in '{c}': {dups}")
    print('head:')
    print(df.head().to_string(index=False))
