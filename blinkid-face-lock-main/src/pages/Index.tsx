import { useEffect, useState, useCallback } from 'react';
import { getAllFaces, deleteFace, type RegisteredFace } from '@/lib/faceDb';
import CameraFeed from '@/components/CameraFeed';
import VerificationPanel from '@/components/VerificationPanel';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';

const Index = () => {
  const [faces, setFaces] = useState<RegisteredFace[]>([]);

  const loadFaces = useCallback(async () => {
    const allFaces = await getAllFaces();
    setFaces(allFaces);
  }, []);

  useEffect(() => {
    loadFaces();
  }, [loadFaces]);

  const handleDelete = async (id: string) => {
    await deleteFace(id);
    toast.success('Face removed');
    loadFaces();
  };

  const handleVerified = useCallback(
    (id: string) => {
      setFaces((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, verified: true, lastVerified: Date.now() } : f
        )
      );
    },
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* Camera - takes 2/3 */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="mb-3 flex items-center gap-3">
              <h1 className="font-display text-lg font-bold tracking-wider text-primary neon-text">
                LIVE DETECTION
              </h1>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            </div>
            <div className="flex-1 flex items-start">
              <CameraFeed
                registeredFaces={faces}
                onVerified={handleVerified}
              />
            </div>
          </div>

          {/* Side panel */}
          <div className="lg:col-span-1">
            <VerificationPanel faces={faces} onDelete={handleDelete} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
