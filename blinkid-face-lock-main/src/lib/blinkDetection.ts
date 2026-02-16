import type * as faceapi from 'face-api.js';

// Eye Aspect Ratio (EAR) calculation
// Based on the paper: "Real-Time Eye Blink Detection using Facial Landmarks"
// EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)

function euclideanDistance(
  p1: faceapi.Point,
  p2: faceapi.Point
): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

export function calculateEAR(landmarks: faceapi.FaceLandmarks68): number {
  const positions = landmarks.positions;

  // Left eye landmarks: indices 36-41
  const leftEye = {
    p1: positions[36],
    p2: positions[37],
    p3: positions[38],
    p4: positions[39],
    p5: positions[40],
    p6: positions[41],
  };

  // Right eye landmarks: indices 42-47
  const rightEye = {
    p1: positions[42],
    p2: positions[43],
    p3: positions[44],
    p4: positions[45],
    p5: positions[46],
    p6: positions[47],
  };

  const leftEAR =
    (euclideanDistance(leftEye.p2, leftEye.p6) +
      euclideanDistance(leftEye.p3, leftEye.p5)) /
    (2 * euclideanDistance(leftEye.p1, leftEye.p4));

  const rightEAR =
    (euclideanDistance(rightEye.p2, rightEye.p6) +
      euclideanDistance(rightEye.p3, rightEye.p5)) /
    (2 * euclideanDistance(rightEye.p1, rightEye.p4));

  return (leftEAR + rightEAR) / 2;
}

const BLINK_THRESHOLD = 0.25;
const BLINK_CONSECUTIVE_FRAMES = 2;

export class BlinkDetector {
  private frameCount = 0;
  private blinkDetected = false;

  reset() {
    this.frameCount = 0;
    this.blinkDetected = false;
  }

  detect(ear: number): boolean {
    if (ear < BLINK_THRESHOLD) {
      this.frameCount++;
    } else {
      if (this.frameCount >= BLINK_CONSECUTIVE_FRAMES) {
        this.blinkDetected = true;
      }
      this.frameCount = 0;
    }

    if (this.blinkDetected) {
      this.blinkDetected = false;
      return true;
    }
    return false;
  }
}
