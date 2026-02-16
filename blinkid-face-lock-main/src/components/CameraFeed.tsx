import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { RegisteredFace, updateFaceVerification } from '@/lib/faceDb';
import { calculateEAR, BlinkDetector } from '@/lib/blinkDetection';
import { Check, Camera, Loader2 } from 'lucide-react';

interface CameraFeedProps {
  registeredFaces: RegisteredFace[];
  onVerified: (id: string) => void;
}

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';

const CameraFeed = ({ registeredFaces, onVerified }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const blinkDetectorRef = useRef(new BlinkDetector());
  const animFrameRef = useRef<number>(0);
  const matcherRef = useRef<faceapi.FaceMatcher | null>(null);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingStatus('Loading face detection models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        setLoadingStatus('Models loaded. Starting camera...');
      } catch (err) {
        console.error('Error loading models:', err);
        setLoadingStatus('Failed to load models. Please refresh.');
      }
    };
    loadModels();
  }, []);

  // Build face matcher when registered faces change
  useEffect(() => {
    if (registeredFaces.length > 0) {
      const labeledDescriptors = registeredFaces.map(
        (face) =>
          new faceapi.LabeledFaceDescriptors(face.name + '|||' + face.id, [
            new Float32Array(face.descriptor),
          ])
      );
      matcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
    } else {
      matcherRef.current = null;
    }
  }, [registeredFaces]);

  // Start camera
  useEffect(() => {
    if (!modelsLoaded) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setLoadingStatus('Camera access denied. Please allow camera.');
      }
    };
    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, [modelsLoaded]);

  // Detection loop
  const detect = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((det) => {
      const box = det.detection.box;

      // Draw face box
      ctx.strokeStyle = 'hsl(180, 100%, 50%)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      ctx.setLineDash([]);

      // Corner decorations
      const cornerLen = 15;
      ctx.strokeStyle = 'hsl(180, 100%, 50%)';
      ctx.lineWidth = 3;
      // top-left
      ctx.beginPath();
      ctx.moveTo(box.x, box.y + cornerLen);
      ctx.lineTo(box.x, box.y);
      ctx.lineTo(box.x + cornerLen, box.y);
      ctx.stroke();
      // top-right
      ctx.beginPath();
      ctx.moveTo(box.x + box.width - cornerLen, box.y);
      ctx.lineTo(box.x + box.width, box.y);
      ctx.lineTo(box.x + box.width, box.y + cornerLen);
      ctx.stroke();
      // bottom-left
      ctx.beginPath();
      ctx.moveTo(box.x, box.y + box.height - cornerLen);
      ctx.lineTo(box.x, box.y + box.height);
      ctx.lineTo(box.x + cornerLen, box.y + box.height);
      ctx.stroke();
      // bottom-right
      ctx.beginPath();
      ctx.moveTo(box.x + box.width - cornerLen, box.y + box.height);
      ctx.lineTo(box.x + box.width, box.y + box.height);
      ctx.lineTo(box.x + box.width, box.y + box.height - cornerLen);
      ctx.stroke();

      // Recognition
      if (matcherRef.current) {
        const match = matcherRef.current.findBestMatch(det.descriptor);
        if (match.label !== 'unknown') {
          const [name, id] = match.label.split('|||');

          // Label
          ctx.fillStyle = 'hsl(180, 100%, 50%)';
          ctx.font = '14px Inter, sans-serif';
          const textWidth = ctx.measureText(name).width;
          ctx.fillStyle = 'hsla(220, 25%, 7%, 0.8)';
          ctx.fillRect(box.x, box.y - 24, textWidth + 16, 22);
          ctx.fillStyle = 'hsl(180, 100%, 50%)';
          ctx.fillText(name, box.x + 8, box.y - 8);

          // Blink detection
          const ear = calculateEAR(det.landmarks);
          const blinked = blinkDetectorRef.current.detect(ear);

          if (blinked) {
            const face = registeredFaces.find((f) => f.id === id);
            if (face && !face.verified) {
              updateFaceVerification(id);
              onVerified(id);
              setVerifiedName(name);
              setTimeout(() => setVerifiedName(null), 3000);
            }
          }
        }
      }
    });

    animFrameRef.current = requestAnimationFrame(detect);
  }, [cameraActive, registeredFaces, onVerified]);

  useEffect(() => {
    if (cameraActive) {
      animFrameRef.current = requestAnimationFrame(detect);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraActive, detect]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden neon-glow border-2 border-primary/20 animate-pulse-border">
      {/* Loading state */}
      {!cameraActive && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-sm text-muted-foreground font-display tracking-wider">
            {loadingStatus}
          </p>
        </div>
      )}

      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full aspect-video object-cover bg-card"
        onPlay={() => setCameraActive(true)}
      />

      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Scanner line */}
      {cameraActive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-40 animate-scan-line"
          />
        </div>
      )}

      {/* Camera indicator */}
      {cameraActive && (
        <div className="absolute top-3 left-3 flex items-center gap-2 glass rounded-full px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs font-medium text-foreground">LIVE</span>
          <Camera className="h-3 w-3 text-muted-foreground" />
        </div>
      )}

      {/* Verification success overlay */}
      {verifiedName && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="animate-checkmark-pop">
            <div className="h-20 w-20 rounded-full bg-neon-green/20 flex items-center justify-center neon-glow-green mb-4">
              <Check className="h-10 w-10 text-neon-green" />
            </div>
          </div>
          <p className="font-display text-lg font-bold text-neon-green neon-text-green animate-fade-in-up">
            VERIFIED
          </p>
          <p className="text-sm text-foreground mt-1 animate-fade-in-up">
            {verifiedName}
          </p>
        </div>
      )}

      {/* No faces hint */}
      {cameraActive && registeredFaces.length === 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Register a face to start verification
          </p>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;
