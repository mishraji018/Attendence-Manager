import { forwardRef, useEffect, useRef } from 'react';
import { RegisteredFace } from '@/lib/faceDb';

interface CameraProps {
  canvasRef?: React.RefObject<HTMLCanvasElement>;  // optional
  onReady?: () => void;
  registeredFaces?: RegisteredFace[];
  onVerified?: (id: string) => void;
}

const CameraFeed = forwardRef<HTMLVideoElement, CameraProps>(
  ({ canvasRef, onReady }, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    const resolvedCanvas = canvasRef ?? internalCanvasRef;

    useEffect(() => {
      const videoEl = (ref as React.RefObject<HTMLVideoElement>)?.current;
      if (!videoEl) return;

      navigator.mediaDevices
        .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
        .then(stream => {
          videoEl.srcObject = stream;
          return videoEl.play();
        })
        .then(() => onReady?.())
        .catch(console.error);

      return () => {
        const stream = videoEl.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
      };
    }, []);

    return (
      <div className="relative w-full h-[60vh] md:h-auto md:aspect-video bg-black rounded-xl overflow-hidden">
        <video ref={ref} className="hidden" width={640} height={480} muted />
        <canvas ref={resolvedCanvas} width={640} height={480} className="w-full h-full object-cover" />
      </div>
    );
  }
);

CameraFeed.displayName = 'CameraFeed';
export default CameraFeed;