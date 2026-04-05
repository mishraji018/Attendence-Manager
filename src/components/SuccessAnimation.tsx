import { useEffect, useRef } from 'react';

interface Props {
  name: string;
  confidence: number;
  onDone?: () => void;
}

export default function SuccessAnimation({ name, confidence, onDone }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    card.classList.remove('running');
    void card.offsetWidth;
    card.classList.add('running');
    const t = setTimeout(() => onDone?.(), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cardIn { from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes circleAnim { from { stroke-dashoffset: 314; } to { stroke-dashoffset: 0; } }
        @keyframes checkAnim { from { stroke-dashoffset: 80; opacity: 0; } to { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 30px rgba(0,245,212,0.2); } 50% { box-shadow: 0 0 60px rgba(0,245,212,0.4); } }

        .success-backdrop { animation: backdropIn 0.3s ease forwards; }
        .success-card { animation: cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both; }
        .running .circle-fg { animation: circleAnim 0.8s cubic-bezier(0.4,0,0.2,1) 0.3s forwards; }
        .running .check-path { animation: checkAnim 0.4s ease 1s forwards; }
        .running .anim-label { animation: fadeUp 0.4s ease 1.1s both; }
        .running .anim-sub { animation: fadeUp 0.4s ease 1.25s both; }
        .running .anim-conf { animation: fadeUp 0.4s ease 1.35s both; }
        .circle-bg { fill: none; stroke: rgba(0,245,212,0.15); stroke-width: 5; }
        .circle-fg {
          fill: none; stroke: #00f5d4; stroke-width: 5; stroke-linecap: round;
          stroke-dasharray: 314; stroke-dashoffset: 314;
          transform-origin: 60px 60px; transform: rotate(-90deg);
          filter: drop-shadow(0 0 8px rgba(0,245,212,0.6));
        }
        .check-path {
          fill: none; stroke: #00f5d4; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round;
          stroke-dasharray: 80; stroke-dashoffset: 80;
          filter: drop-shadow(0 0 6px rgba(0,245,212,0.8));
        }
        .anim-label { opacity: 0; }
        .anim-sub { opacity: 0; }
        .anim-conf { opacity: 0; }
      `}</style>

      <div
        className="success-backdrop fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(2, 8, 23, 0.85)', backdropFilter: 'blur(12px)' }}
        onClick={onDone}
      >
        <div
          className="success-card relative flex flex-col items-center px-12 py-10 rounded-3xl"
          style={{
            background: 'rgba(0, 245, 212, 0.04)',
            border: '1px solid rgba(0, 245, 212, 0.2)',
            boxShadow: '0 0 40px rgba(0,245,212,0.15), inset 0 0 40px rgba(0,245,212,0.03)',
            animation: 'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both, glowPulse 2s ease 1.5s infinite',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Corner decorations */}
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-cyan-400/40 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-cyan-400/40 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-cyan-400/40 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-cyan-400/40 rounded-br-lg" />

          <div ref={cardRef}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle className="circle-bg" cx="60" cy="60" r="50" />
              <circle className="circle-fg" cx="60" cy="60" r="50" />
              <polyline className="check-path" points="36,62 52,78 84,42" />
            </svg>

            <p className="anim-label text-center mt-4 text-xl font-bold tracking-wider"
              style={{ color: '#00f5d4', textShadow: '0 0 20px rgba(0,245,212,0.5)', fontFamily: 'Rajdhani, sans-serif' }}>
              IDENTITY VERIFIED
            </p>
            <p className="anim-sub text-center mt-1 text-white text-lg font-medium">
              Welcome, {name}
            </p>
            <p className="anim-conf text-center mt-1 text-xs"
              style={{ color: 'rgba(0,245,212,0.6)' }}>
              {confidence}% match confidence
            </p>
          </div>

          <p className="mt-6 text-xs text-gray-600">Click anywhere to dismiss</p>
        </div>
      </div>
    </>
  );
}