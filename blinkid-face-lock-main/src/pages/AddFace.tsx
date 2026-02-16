import { useRef, useState, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { addFace, type RegisteredFace } from '@/lib/faceDb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, RefreshCw, Check, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';

const AddFace = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<Float32Array | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;
    let stream: MediaStream;
    const start = async () => {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      }
    };
    start();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [modelsLoaded]);

  // Draw face guide oval
  useEffect(() => {
    if (!cameraReady || !canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!capturedImage) {
        ctx.strokeStyle = 'hsl(180, 100%, 50%)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.ellipse(
          canvas.width / 2,
          canvas.height / 2,
          100,
          140,
          0,
          0,
          2 * Math.PI
        );
        ctx.stroke();
        ctx.setLineDash([]);
      }
      requestAnimationFrame(draw);
    };
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [cameraReady, capturedImage]);

  const capture = useCallback(async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setCapturing(true);

    try {
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error('No face detected. Please align your face in the oval.');
        setCapturing(false);
        return;
      }

      // Capture thumbnail
      const tempCanvas = document.createElement('canvas');
      const box = detection.detection.box;
      const padding = 40;
      tempCanvas.width = 150;
      tempCanvas.height = 150;
      const tCtx = tempCanvas.getContext('2d')!;
      tCtx.drawImage(
        videoRef.current,
        Math.max(0, box.x - padding),
        Math.max(0, box.y - padding),
        box.width + padding * 2,
        box.height + padding * 2,
        0,
        0,
        150,
        150
      );

      setCapturedImage(tempCanvas.toDataURL('image/jpeg', 0.8));
      setCapturedDescriptor(detection.descriptor);
    } catch (err) {
      toast.error('Detection failed. Please try again.');
    }
    setCapturing(false);
  }, [modelsLoaded]);

  const save = async () => {
    if (!name.trim() || !capturedDescriptor || !capturedImage) {
      toast.error('Please enter a name and capture your face.');
      return;
    }

    setSaving(true);
    const face: RegisteredFace = {
      id: crypto.randomUUID(),
      name: name.trim(),
      descriptor: capturedDescriptor,
      imageData: capturedImage,
      createdAt: Date.now(),
      lastVerified: null,
      verified: false,
    };

    await addFace(face);
    toast.success(`${face.name} registered successfully!`);
    setSaving(false);
    navigate('/');
  };

  const retry = () => {
    setCapturedImage(null);
    setCapturedDescriptor(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="glass rounded-xl p-6 space-y-6">
          <div className="text-center">
            <h1 className="font-display text-xl font-bold tracking-wider text-primary neon-text">
              REGISTER FACE
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Align your face within the oval and capture
            </p>
          </div>

          {/* Name input */}
          <div>
            <label className="text-xs font-display tracking-wider text-muted-foreground mb-2 block">
              NAME
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="bg-secondary/50 border-border focus:border-primary"
            />
          </div>

          {/* Camera view */}
          <div className="relative rounded-lg overflow-hidden border border-border">
            {!cameraReady && (
              <div className="aspect-video flex items-center justify-center bg-card">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full aspect-video object-cover ${capturedImage ? 'hidden' : ''}`}
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full pointer-events-none ${capturedImage ? 'hidden' : ''}`}
            />

            {capturedImage && (
              <div className="aspect-video flex items-center justify-center bg-card">
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="h-40 w-40 rounded-full object-cover border-4 border-primary neon-glow"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!capturedImage ? (
              <Button
                onClick={capture}
                disabled={capturing || !cameraReady || !modelsLoaded}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 neon-glow"
              >
                {capturing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                {capturing ? 'Detecting...' : 'Capture Face'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={retry}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button
                  onClick={save}
                  disabled={saving || !name.trim()}
                  className="flex-1 bg-neon-green text-primary-foreground hover:bg-neon-green/80 neon-glow-green"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save Face'}
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddFace;
