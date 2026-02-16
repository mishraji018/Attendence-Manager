import { openDB, type DBSchema } from 'idb';

export interface RegisteredFace {
  id: string;
  name: string;
  descriptor: Float32Array;
  imageData: string; // base64 thumbnail
  createdAt: number;
  lastVerified: number | null;
  verified: boolean;
}

interface FaceDB extends DBSchema {
  faces: {
    key: string;
    value: RegisteredFace;
  };
}

const DB_NAME = 'face-recognition-db';
const DB_VERSION = 1;

async function getDb() {
  return openDB<FaceDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('faces')) {
        db.createObjectStore('faces', { keyPath: 'id' });
      }
    },
  });
}

export async function addFace(face: RegisteredFace): Promise<void> {
  const db = await getDb();
  await db.put('faces', face);
}

export async function getAllFaces(): Promise<RegisteredFace[]> {
  const db = await getDb();
  return db.getAll('faces');
}

export async function deleteFace(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('faces', id);
}

export async function updateFaceVerification(id: string): Promise<void> {
  const db = await getDb();
  const face = await db.get('faces', id);
  if (face) {
    face.verified = true;
    face.lastVerified = Date.now();
    await db.put('faces', face);
  }
}
