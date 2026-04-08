import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const EAR_THRESHOLD = 0.28;
const BLINK_MIN_FRAMES = 1;

export const useFaceDetection = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onBlink?: () => void
) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const onBlinkRef = useRef(onBlink);
  const earHistory = useRef<number[]>([]);
  const blinkCooldown = useRef(false);
  const rafRef = useRef<number>();

  useEffect(() => { onBlinkRef.current = onBlink; }, [onBlink]);

  useEffect(() => {
    faceapi.nets.tinyFaceDetector.loadFromUri('/models')
      .then(() => faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'))
      .then(() => {
        console.log('✅ Face-api models loaded!');
        setModelsLoaded(true);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;
    let active = true;

    const ear = (eye: faceapi.Point[]) => {
      if (eye.length < 6) return 1;
      const A = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
      const B = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
      const C = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
      return (A + B) / (2 * C);
    };

    const loop = async () => {
      if (!active) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });

      if (!video || !canvas || !ctx || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Low light enhancement
      ctx.filter = 'brightness(1.1) contrast(1.1)';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';

      // Vignette effect
      const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.25,
        canvas.width / 2, canvas.height / 2, canvas.height * 0.85
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const det = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.2, inputSize: 224 }))
        .withFaceLandmarks(true);

      if (det) {
        setFaceDetected(true);

        // Draw face box
        const { x, y, width, height } = det.detection.box;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // EAR calculation
        const leftEAR = ear(det.landmarks.getLeftEye());
        const rightEAR = ear(det.landmarks.getRightEye());
        const avgEAR = (leftEAR + rightEAR) / 2;

        earHistory.current.push(avgEAR);
        if (earHistory.current.length > 10) earHistory.current.shift();

        if (earHistory.current.length === 10 && !blinkCooldown.current) {
          const maxRecent = Math.max(...earHistory.current);
          
          // Agar current aankh pichle kuch frames ke muqable 18% zyada closed hui (movement of eye)
          if (avgEAR < maxRecent * 0.82) {
            console.log(`✅ AUTO-ADAPTIVE BLINK Sensed! Drop: ${maxRecent.toFixed(3)} to ${avgEAR.toFixed(3)}`);
            blinkCooldown.current = true;
            onBlinkRef.current?.();
            setTimeout(() => {
              blinkCooldown.current = false;
              earHistory.current = [];
            }, 1500);
          }
        }
      } else {
        setFaceDetected(false);
        earHistory.current = [];
        ctx.filter = 'brightness(1.1) contrast(1.1)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
      }

      if (active) rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [modelsLoaded, videoRef, canvasRef]);

  return { modelsLoaded, faceDetected };
};