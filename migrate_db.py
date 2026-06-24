import sqlite3
import os

db_path = os.path.join('database', 'face_lock.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

columns_to_add = [
    ("face_registered", "BOOLEAN DEFAULT 0"),
    ("face_encoding", "TEXT"),
    ("face_image", "VARCHAR(255)"),
]

for col_name, col_type in columns_to_add:
    try:
        cursor.execute(f"ALTER TABLE students ADD COLUMN {col_name} {col_type};")
        print(f"Added {col_name} column.")
    except sqlite3.OperationalError as e:
        print(f"Column {col_name} already exists or error: {e}")

conn.commit()
conn.close()
print("Migration completed successfully.")
