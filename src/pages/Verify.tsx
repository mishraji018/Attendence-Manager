import { useRef, useState, useCallback, useEffect } from 'react';
import CameraFeed from '@/components/CameraFeed';
import { useFaceDetection } from '@/lib/blinkDetection';
import { verifyFace, captureRawFrame } from '@/lib/faceDb';
import { Link } from 'react-router-dom';
import SuccessAnimation from '@/components/SuccessAnimation';

type Step = 'waiting_face' | 'waiting_blink' | 'processing' | 'success' | 'failed';

export default function Verify() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<Step>('waiting_face');
  const [result, setResult] = useState<any>(null);
  const isProcessing = useRef(false);

  const handleBlink = useCallback(async () => {
    console.log('🔵 handleBlink called!');
    if (isProcessing.current) return;
    isProcessing.current = true;
    setStep('processing');

    const video = videoRef.current;
    if (!video) { isProcessing.current = false; return; }

    const blob = await captureRawFrame(video);
    if (!blob) { isProcessing.current = false; return; }

    try {
      const data = await verifyFace(blob);
      console.log('✅ Verify result:', data);
      setResult(data);
      setStep(data.verified ? 'success' : 'failed');
    } catch (e: any) {
      console.log('❌ Error:', e.message);
      setResult({ message: e.message });
      setStep('failed');
    }
    isProcessing.current = false;
  }, []);

  const { modelsLoaded, faceDetected } = useFaceDetection(videoRef, canvasRef, handleBlink);

  useEffect(() => {
    if (step === 'processing' || step === 'success' || step === 'failed') return;
    setStep(faceDetected ? 'waiting_blink' : 'waiting_face');
  }, [faceDetected, step]);

  const reset = () => {
    setStep('waiting_face');
    setResult(null);
    isProcessing.current = false;
  };

  const stepConfig: Record<Step, { label: string; color: string }> = {
    waiting_face:  { label: '👁️ Position your face in camera', color: 'bg-gray-800/60 border-gray-700' },
    waiting_blink: { label: '😉 Face detected! Now BLINK to verify', color: 'bg-blue-900/60 border-blue-700' },
    processing:    { label: '⏳ Verifying...', color: 'bg-yellow-900/60 border-yellow-700' },
    success:       { label: `✅ ${result?.message || 'Verified!'}`, color: 'bg-green-900/60 border-green-700' },
    failed:        { label: `❌ ${result?.message || 'Not recognized'}`, color: 'bg-red-900/60 border-red-700' },
  };

  const cfg = stepConfig[step];

  return (
    <div className="min-h-screen grid-bg text-white p-6">

      {step === 'success' && result?.verified && (
        <SuccessAnimation
          name={result.name}
          confidence={result.confidence}
          onDone={reset}
        />
      )}

      <div className="max-w-xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-cyan-400 transition-colors">← Back</Link>
          <h1 className="neon-text text-2xl font-bold">VERIFY IDENTITY</h1>
        </div>

        {/* Status bar */}
        <div className={`glass border ${cfg.color} rounded-xl p-4 text-center font-semibold transition-all duration-300`}>
          {cfg.label}
          {result?.confidence > 0 && (
            <span className="ml-2 text-sm opacity-75">({result.confidence}% match)</span>
          )}
        </div>

        {/* Camera */}
        <div className="relative rounded-2xl overflow-hidden neon-border">
          {faceDetected && <div className="scan-line z-10" />}

          <CameraFeed ref={videoRef} canvasRef={canvasRef} />

          {/* Corner decorations */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-lg" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-lg" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-lg" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400/60 rounded-br-lg" />

          {/* Blink hint */}
          {step === 'waiting_blink' && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 glass px-5 py-2 text-sm text-cyan-300 font-semibold animate-pulse neon-border">
              😉 Blink now!
            </div>
          )}

          {/* Processing overlay */}
          {step === 'processing' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-cyan-400 text-sm font-semibold">Verifying...</p>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {!modelsLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-cyan-400 text-sm">Loading AI models...</p>
              </div>
            </div>
          )}
        </div>

        {/* Failed state */}
        {step === 'failed' && (
          <div className="glass border border-red-700/50 rounded-xl p-4 text-center space-y-3">
            <p className="text-red-300 font-semibold">❌ {result?.message || 'Face not recognized'}</p>
            <button
              onClick={reset}
              className="w-full bg-red-600/80 hover:bg-red-600 border border-red-500/30 rounded-lg py-2 font-semibold transition"
            >
              🔄 Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}