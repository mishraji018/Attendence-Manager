const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface RegisteredFace {
  id: string;
  name: string;
  samples?: number;
  since?: string;
  verified?: boolean;
  lastVerified?: number;
}

export const registerFace = async (name: string, blob: Blob) => {
  const fd = new FormData();
  fd.append('name', name);
  fd.append('file', blob, 'face.jpg');
  const res = await fetch(`${API_URL}/register`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error((await res.json()).detail);
  return res.json();
};

export const verifyFace = async (blob: Blob) => {
  const fd = new FormData();
  fd.append('file', blob, 'face.jpg');
  const res = await fetch(`${API_URL}/verify`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error((await res.json()).detail);
  return res.json();
};

export const getAllFaces = async (): Promise<RegisteredFace[]> => {
  const res = await fetch(`${API_URL}/users`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.users.map((u: any) => ({
    id: u.name,
    name: u.name,
    samples: u.samples,
    since: u.since,
  }));
};

export const deleteFace = async (name: string): Promise<void> => {
  await fetch(`${API_URL}/user/${name}`, { method: 'DELETE' });
};

export const renameFace = async (oldName: string, newName: string): Promise<void> => {
  const fd = new FormData();
  fd.append('new_name', newName);
  await fetch(`${API_URL}/user/${oldName}`, { method: 'PUT', body: fd });
};

export const captureRawFrame = (video: HTMLVideoElement): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(null);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(resolve, 'image/jpeg', 0.92);
  });
};