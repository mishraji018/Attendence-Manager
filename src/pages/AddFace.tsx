import { useRef, useState, useCallback } from 'react';
import CameraFeed from '@/components/CameraFeed';
import { useFaceDetection } from '@/lib/blinkDetection';
import { registerFace } from '@/lib/faceDb';
import { Link } from 'react-router-dom';

const POSES = [
  { label: '😐 Seedha dekho' },
  { label: '⬅️ Thoda left dekho' },
  { label: '➡️ Thoda right dekho' },
  { label: '⬆️ Thoda upar dekho' },
  { label: '😊 Smile karo' },
  { label: '📸 Normal — last shot' },
];

export default function AddFace() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState('');
  const [step, setStep] = useState<'idle' | 'capturing' | 'done'>('idle');
  const [poseIndex, setPoseIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const { modelsLoaded, faceDetected } = useFaceDetection(videoRef, canvasRef);

  const captureNext = useCallback(async (personName: string, index: number) => {
    setCapturing(true);
    await new Promise(r => setTimeout(r, 2000));

    const video = videoRef.current;
    if (!video) { setCapturing(false); return; }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) { setCapturing(false); return; }

    ctx.drawImage(video, 0, 0);
    tempCanvas.toBlob(async (blob) => {
      if (!blob) { setCapturing(false); return; }
      try {
        await registerFace(personName, blob);
        const next = index + 1;
        setProgress(next);
        if (next >= POSES.length) {
          setStep('done');
          setMessage(`✅ Registration complete! ${POSES.length} poses captured for ${personName}`);
        } else {
          setPoseIndex(next);
          setCapturing(false);
          setTimeout(() => captureNext(personName, next), 2000);
        }
      } catch (e: any) {
        setMessage(`❌ ${e.message}`);
        setCapturing(false);
      }
    }, 'image/jpeg', 0.92);
  }, []);

  const startRegistration = () => {
    if (!name.trim()) return setMessage('Please enter your name');
    if (!faceDetected) return setMessage('No face detected — move closer');
    setStep('capturing');
    setPoseIndex(0);
    setProgress(0);
    setMessage('');
    captureNext(name.trim(), 0);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-white">← Back</Link>
          <h1 className="text-2xl font-bold">Register Face</h1>
        </div>

        {step === 'idle' && (
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
          />
        )}

        {step === 'capturing' && (
          <div className="bg-blue-900 rounded-xl p-4 text-center space-y-2">
            <p className="text-sm text-blue-300">Pose {poseIndex + 1} of {POSES.length}</p>
            <p className="text-2xl font-bold">{POSES[poseIndex].label}</p>
            {capturing
              ? <p className="text-yellow-300 text-sm animate-pulse">📸 Capturing...</p>
              : <p className="text-green-300 text-sm">Hold this pose...</p>
            }
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(progress / POSES.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="relative">
          <CameraFeed ref={videoRef} canvasRef={canvasRef} />
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${faceDetected ? 'bg-green-500' : 'bg-red-500/80'}`}>
            {faceDetected ? '✓ Face Detected' : 'No Face'}
          </div>
          {!modelsLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
              <p className="text-yellow-400 text-sm">Loading models...</p>
            </div>
          )}
        </div>

        {step === 'idle' && (
          <button
            onClick={startRegistration}
            disabled={!modelsLoaded || !faceDetected}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg py-3 font-semibold transition"
          >
            📸 Start Registration
          </button>
        )}

        {step === 'done' && (
          <div className="space-y-3">
            <div className="bg-green-900 text-green-200 p-4 rounded-lg text-center font-semibold">
              {message}
            </div>
            <button
              onClick={() => { setStep('idle'); setName(''); setMessage(''); setProgress(0); }}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-3 font-semibold transition"
            >
              ➕ Register Another Person
            </button>
            <Link to="/" className="block w-full bg-green-600 hover:bg-green-700 rounded-lg py-3 font-semibold transition text-center">
              👁️ Go to Home
            </Link>
          </div>
        )}

        {message && step !== 'done' && (
          <div className="bg-red-900 text-red-200 p-3 rounded-lg text-sm">{message}</div>
        )}
      </div>
    </div>
  );
}