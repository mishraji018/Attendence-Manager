import sqlite3
conn = sqlite3.connect('database/face_lock.db')
conn.execute("UPDATE students SET face_registered = 0, face_encoding = NULL, face_image = NULL WHERE roll_no = '1234'")
conn.commit()
print("Reset face data for roll 1234")
conn.close()
