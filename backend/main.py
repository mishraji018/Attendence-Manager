from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageEnhance
import numpy as np
import cv2, os, io, aiosqlite

app = FastAPI(title="BlinkID Face Lock API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "faces.db"
FACES_DIR = "faces"
os.makedirs(FACES_DIR, exist_ok=True)

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")
recognizer = cv2.face.LBPHFaceRecognizer_create()

# ── DB Setup ──────────────────────────────────────────
async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS faces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                image_path TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()

@app.on_event("startup")
async def startup():
    await init_db()
    await retrain_model()

# ── Helpers ───────────────────────────────────────────
def enhance_image(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = ImageEnhance.Brightness(img).enhance(1.1)
    img = ImageEnhance.Contrast(img).enhance(1.1)
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

def extract_face(img_bgr):
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    faces = face_cascade.detectMultiScale(gray, 1.1, 3, minSize=(60, 60))
    if len(faces) == 0:
        faces = profile_cascade.detectMultiScale(gray, 1.1, 3, minSize=(60, 60))
    if len(faces) == 0:
        flipped = cv2.flip(gray, 1)
        faces = profile_cascade.detectMultiScale(flipped, 1.1, 3, minSize=(60, 60))
    if len(faces) == 0:
        return None
    x, y, w, h = faces[0]
    return cv2.resize(gray[y:y+h, x:x+w], (200, 200))

async def retrain_model():
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT name, image_path FROM faces") as cursor:
            rows = await cursor.fetchall()

    if not rows:
        return

    names = list(set(r[0] for r in rows))
    faces, labels = [], []

    for name, path in rows:
        if not os.path.exists(path):
            continue
        img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
        if img is not None:
            faces.append(img)
            labels.append(names.index(name))

    if faces:
        recognizer.train(faces, np.array(labels))
        recognizer.save("model.yml")
        print(f"✅ Model trained with {len(faces)} images for {len(names)} people")

# ── Routes ────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "running"}

@app.get("/users")
async def get_users():
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT name, COUNT(*) as count, MIN(created_at) as since FROM faces GROUP BY name"
        ) as cursor:
            rows = await cursor.fetchall()
    return {
        "users": [{"name": r[0], "samples": r[1], "since": r[2]} for r in rows]
    }

@app.post("/register")
async def register(name: str = Form(...), file: UploadFile = File(...)):
    if not name.strip():
        raise HTTPException(400, "Name is required")

    img = enhance_image(await file.read())
    face_roi = extract_face(img)
    if face_roi is None:
        raise HTTPException(400, "No face detected. Move closer or improve lighting.")

    # Save face image
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) FROM faces WHERE name=?", (name.strip(),)) as cur:
            count = (await cur.fetchone())[0]

    img_path = f"{FACES_DIR}/{name.strip()}_{count}.png"
    cv2.imwrite(img_path, face_roi)

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("INSERT INTO faces (name, image_path) VALUES (?, ?)", (name.strip(), img_path))
        await db.commit()

    await retrain_model()
    return {"success": True, "message": f"✅ Sample {count + 1} saved for {name.strip()}"}

@app.post("/verify")
async def verify(file: UploadFile = File(...)):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT DISTINCT name FROM faces") as cursor:
            names = [r[0] for r in await cursor.fetchall()]

    if not names:
        raise HTTPException(400, "No registered faces. Please register first.")

    if not os.path.exists("model.yml"):
        await retrain_model()
    if not os.path.exists("model.yml"):
        raise HTTPException(400, "Model not ready.")

    recognizer.read("model.yml")
    img = enhance_image(await file.read())
    face_roi = extract_face(img)

    if face_roi is None:
        raise HTTPException(400, "No face detected in image")

    label, confidence = recognizer.predict(face_roi)
    display_pct = round(max(0, 100 - confidence), 1)

    if confidence < 100:
        return {"verified": True, "name": names[label], "confidence": display_pct, "message": f"Welcome, {names[label]}!"}

    return {"verified": False, "name": None, "confidence": 0, "message": "Face not recognized"}

@app.delete("/user/{name}")
async def delete_user(name: str):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT image_path FROM faces WHERE name=?", (name,)) as cur:
            rows = await cur.fetchall()
        if not rows:
            raise HTTPException(404, "User not found")
        await db.execute("DELETE FROM faces WHERE name=?", (name,))
        await db.commit()

    # Delete face images
    for (path,) in rows:
        if os.path.exists(path):
            os.remove(path)

    # Retrain without deleted user
    if os.path.exists("model.yml"):
        os.remove("model.yml")
    await retrain_model()

    return {"success": True, "message": f"✅ {name} deleted"}

@app.put("/user/{old_name}")
async def rename_user(old_name: str, new_name: str = Form(...)):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT id, image_path FROM faces WHERE name=?", (old_name,)) as cur:
            rows = await cur.fetchall()
        if not rows:
            raise HTTPException(404, "User not found")

        for row_id, old_path in rows:
            new_path = old_path.replace(old_name, new_name)
            if os.path.exists(old_path):
                os.rename(old_path, new_path)
            await db.execute("UPDATE faces SET name=?, image_path=? WHERE id=?", (new_name, new_path, row_id))
        await db.commit()

    await retrain_model()
    return {"success": True, "message": f"✅ Renamed to {new_name}"}