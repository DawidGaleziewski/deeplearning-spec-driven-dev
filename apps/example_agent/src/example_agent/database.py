"""Local SQLite store with mock sales data for the course exercises.

Replaces the original parquet + DuckDB setup so the agent runs with no
external data file. The mock data mimics the shape of the course's
"Store Sales / Price Elasticity / Promotions" dataset.
"""

import os
import random
import sqlite3

# project root is apps/example_agent (three levels up from src/example_agent/database.py)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DB_PATH = os.path.join(PROJECT_ROOT, "data", "sales.db")
TABLE_NAME = "sales"

# stores present in the mock data; 1320 is the one used by the course example query
STORE_NUMBERS = [1320, 1210, 1145, 1460, 1085]
SKU_CODES = list(range(6811, 6836))
PRODUCT_CLASS_CODES = [22875, 22800, 24400, 26890]

# date range covered by the mock data (inclusive)
START_DATE = "2021-10-01"
END_DATE = "2021-12-31"


def _date_range(start: str, end: str):
    from datetime import date, timedelta

    y, m, d = map(int, start.split("-"))
    cur = date(y, m, d)
    y, m, d = map(int, end.split("-"))
    last = date(y, m, d)
    while cur <= last:
        yield cur.isoformat()
        cur += timedelta(days=1)


def _generate_rows():
    """Deterministically generate mock sales rows."""
    rng = random.Random(42)
    rows = []
    for sold_date in _date_range(START_DATE, END_DATE):
        for store in STORE_NUMBERS:
            for _ in range(rng.randint(3, 8)):
                sku = rng.choice(SKU_CODES)
                product_class = rng.choice(PRODUCT_CLASS_CODES)
                qty = rng.randint(1, 12)
                unit_price = round(rng.uniform(1.5, 45.0), 2)
                on_promo = 1 if rng.random() < 0.25 else 0
                discount = 0.8 if on_promo else 1.0
                total = round(qty * unit_price * discount, 2)
                rows.append(
                    (store, sku, product_class, sold_date, qty, total, on_promo)
                )
    return rows


def init_db(force: bool = False) -> str:
    """Create and populate data/sales.db if it does not already exist.

    Returns the path to the database file.
    """
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    if force and os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    try:
        existing = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            (TABLE_NAME,),
        ).fetchone()
        if existing is None:
            conn.execute(
                f"""
                CREATE TABLE {TABLE_NAME} (
                    Store_Number       INTEGER,
                    SKU_Coded          INTEGER,
                    Product_Class_Code INTEGER,
                    Sold_Date          TEXT,
                    Qty_Sold           INTEGER,
                    Total_Sale_Value   REAL,
                    On_Promo           INTEGER
                )
                """
            )
            conn.executemany(
                f"INSERT INTO {TABLE_NAME} VALUES (?, ?, ?, ?, ?, ?, ?)",
                _generate_rows(),
            )
            conn.commit()
    finally:
        conn.close()

    return DB_PATH


def get_connection() -> sqlite3.Connection:
    """Return a connection to the (initialized) sales database."""
    init_db()
    return sqlite3.connect(DB_PATH)


if __name__ == "__main__":
    path = init_db(force=True)
    with sqlite3.connect(path) as c:
        n = c.execute(f"SELECT COUNT(*) FROM {TABLE_NAME}").fetchone()[0]
    print(f"Seeded {n} rows into {path}")
