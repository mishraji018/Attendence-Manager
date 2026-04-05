import { useState } from 'react';
import { RegisteredFace, renameFace } from '@/lib/faceDb';

interface Props {
  faces: RegisteredFace[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export default function VerificationPanel({ faces, onDelete, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const handleRename = async (oldName: string) => {
    if (!newName.trim() || newName === oldName) { setEditingId(null); return; }
    await renameFace(oldName, newName.trim());
    setEditingId(null);
    setNewName('');
    onRefresh();
  };

  return (
    <div className="glass-strong h-full flex flex-col p-5 min-h-[500px]">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-6 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(0,245,212,0.8)]" />
        <h2 className="neon-text text-sm font-bold tracking-widest">REGISTERED FACES</h2>
        <span className="ml-auto bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs px-2 py-0.5 rounded-full">
          {faces.length}
        </span>
      </div>

      {faces.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-600">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center text-2xl">👤</div>
          <p className="text-sm">No faces registered yet</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {faces.map((face) => (
            <div
              key={face.id}
              className="group rounded-xl px-4 py-3 transition-all duration-300 border"
              style={{
                background: face.verified ? 'rgba(0,245,212,0.05)' : 'rgba(255,255,255,0.03)',
                borderColor: face.verified ? 'rgba(0,245,212,0.2)' : 'rgba(255,255,255,0.06)',
              }}
            >
              {editingId === face.id ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRename(face.name)}
                    className="flex-1 bg-gray-800 border border-cyan-500/30 rounded-lg px-3 py-1 text-sm text-white focus:outline-none"
                    placeholder="New name..."
                  />
                  <button onClick={() => handleRename(face.name)} className="text-cyan-400 text-xs px-2 py-1 rounded hover:bg-cyan-500/10">✓</button>
                  <button onClick={() => setEditingId(null)} className="text-gray-500 text-xs px-2 py-1 rounded hover:bg-gray-500/10">✕</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border ${
                      face.verified ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-gray-700/50 border-gray-600/30 text-gray-400'
                    }`}>
                      {face.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{face.name}</p>
                      <p className="text-xs text-gray-600">
                        {face.samples} samples
                        {face.lastVerified && ` · ✓ ${new Date(face.lastVerified).toLocaleTimeString()}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className={`w-2 h-2 rounded-full mr-1 ${face.verified ? 'bg-cyan-400' : 'bg-gray-600'}`} />
                    <button
                      onClick={() => { setEditingId(face.id); setNewName(face.name); }}
                      className="text-blue-400/70 hover:text-blue-400 text-xs px-2 py-1 rounded hover:bg-blue-500/10 transition"
                      title="Rename"
                    >✏️</button>
                    <button
                      onClick={() => onDelete(face.id)}
                      className="text-red-400/70 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition"
                      title="Delete"
                    >🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/5 text-center">
        <p className="text-xs text-gray-600">Hover to edit or delete · Blink to verify</p>
      </div>
    </div>
  );
}