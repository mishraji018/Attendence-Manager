import { RegisteredFace } from '@/lib/faceDb';
import { Check, Clock, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VerificationPanelProps {
  faces: RegisteredFace[];
  onDelete: (id: string) => void;
}

const VerificationPanel = ({ faces, onDelete }: VerificationPanelProps) => {
  return (
    <div className="glass rounded-xl p-4 h-full flex flex-col">
      <h2 className="font-display text-sm font-semibold tracking-wider text-primary neon-text mb-4">
        REGISTERED FACES
      </h2>

      {faces.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12">
          <User className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm text-center">No faces registered yet.</p>
          <p className="text-xs text-center mt-1 opacity-60">
            Click "Add Face" to get started
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {faces.map((face) => (
            <div
              key={face.id}
              className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
                face.verified
                  ? 'bg-neon-green/5 border border-neon-green/20'
                  : 'bg-secondary/50 border border-border'
              }`}
              style={{
                animation: 'fade-in-up 0.4s ease-out forwards',
              }}
            >
              <div className="relative h-10 w-10 flex-shrink-0 rounded-full overflow-hidden border-2 border-border">
                {face.imageData ? (
                  <img
                    src={face.imageData}
                    alt={face.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                {face.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-neon-green rounded-full p-0.5">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {face.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {face.verified ? (
                    <>
                      <Check className="h-3 w-3 text-neon-green" />
                      <span className="text-[10px] text-neon-green font-medium">
                        VERIFIED
                      </span>
                      {face.lastVerified && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {new Date(face.lastVerified).toLocaleTimeString()}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        PENDING
                      </span>
                    </>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                onClick={() => onDelete(face.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Total: {faces.length}</span>
          <span className="text-neon-green">
            Verified: {faces.filter((f) => f.verified).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VerificationPanel;
