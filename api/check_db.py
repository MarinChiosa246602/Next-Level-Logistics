import sqlite3

conn = sqlite3.connect('farmer_data.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute("SELECT * FROM records ORDER BY created_at DESC LIMIT 1")
record = dict(cur.fetchone())
print("RECORD:", record)

cur.execute("SELECT * FROM record_products WHERE record_id = ?", (record['record_id'],))
products = [dict(row) for row in cur.fetchall()]
print("PRODUCTS:", products)

conn.close()
