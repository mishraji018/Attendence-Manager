import { useRef, useEffect, useState, useCallback } from 'react';
import CameraFeed from '@/components/CameraFeed';
import VerificationPanel from '@/components/VerificationPanel';
import Navbar from '@/components/Navbar';
import { useFaceDetection } from '@/lib/blinkDetection';
import SuccessAnimation from '@/components/SuccessAnimation';
import { getAllFaces, deleteFace, verifyFace, captureRawFrame, type RegisteredFace } from '@/lib/faceDb';
import { toast } from 'sonner';

const Index = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faces, setFaces] = useState<RegisteredFace[]>([]);
  const [verifiedResult, setVerifiedResult] = useState<{ name: string; confidence: number } | null>(null);
  const isProcessing = useRef(false);

  const loadFaces = useCallback(async () => {
    const allFaces = await getAllFaces();
    setFaces(allFaces);
  }, []);

  useEffect(() => { loadFaces(); }, [loadFaces]);

  const handleDelete = async (id: string) => {
    await deleteFace(id);
    toast.success('Face removed');
    loadFaces();
  };

  const handleBlink = useCallback(async () => {
    console.log('🔵 handleBlink called!');
    if (isProcessing.current) return;
    isProcessing.current = true;

    const video = videoRef.current;
    if (!video) { isProcessing.current = false; return; }

    const blob = await captureRawFrame(video);
    if (!blob) { isProcessing.current = false; return; }

    try {
      const data = await verifyFace(blob);
      console.log('✅ Verify result:', data);
      if (data.verified) {
        setVerifiedResult({ name: data.name, confidence: data.confidence });
        setFaces(prev => prev.map(f =>
          f.name === data.name ? { ...f, verified: true, lastVerified: Date.now() } : f
        ));
      } else {
        toast.error('❌ Face not recognized');
      }
    } catch (e: any) {
      console.log('❌ Error:', e.message);
      toast.error(e.message);
    }
    isProcessing.current = false;
  }, []);

  const { modelsLoaded, faceDetected } = useFaceDetection(videoRef, canvasRef, handleBlink);

  return (
    <div className="min-h-screen grid-bg text-white">
      {verifiedResult && (
        <SuccessAnimation
          name={verifiedResult.name}
          confidence={verifiedResult.confidence}
          onDone={() => { setVerifiedResult(null); isProcessing.current = false; }}
        />
      )}

      <Navbar />

      <main className="container mx-auto px-6 pt-28 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Camera Section */}
          <div className="lg:col-span-2 fade-in-up">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-cyan-400 pulse-ring' : 'bg-gray-600'}`} />
                <h1 className="neon-text text-lg font-bold">LIVE DETECTION</h1>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300 ${
                !modelsLoaded
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  : faceDetected
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
              }`}>
                {!modelsLoaded ? '⏳ Loading models...' : faceDetected ? '✓ Face Detected — Blink to verify' : 'No Face Detected'}
              </div>
            </div>

            {/* Camera Box */}
            <div className="relative rounded-2xl overflow-hidden neon-border">
              {faceDetected && <div className="scan-line z-10" />}
              <CameraFeed ref={videoRef} canvasRef={canvasRef} />

              {/* Corner decorations */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400/60 rounded-br-lg" />

              {/* Blink hint */}
              {faceDetected && modelsLoaded && !verifiedResult && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 glass px-5 py-2 text-sm text-cyan-300 font-semibold animate-pulse neon-border">
                  😉 Blink to verify
                </div>
              )}

              {/* Loading overlay */}
              {!modelsLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-cyan-400 text-sm font-semibold">Loading AI models...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="mt-4 glass px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-6 text-xs text-gray-400">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Local Processing
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Blink Detection Active
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {faces.length} Face{faces.length !== 1 ? 's' : ''} Registered
                </span>
              </div>
            </div>
          </div>

          {/* Side Panel — onRefresh added here */}
          <div className="lg:col-span-1 fade-in-up" style={{ animationDelay: '0.1s' }}>
            <VerificationPanel
              faces={faces}
              onDelete={handleDelete}
              onRefresh={loadFaces}
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default Index;