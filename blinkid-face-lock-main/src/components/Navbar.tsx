import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, UserPlus, Shield } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAddFace = location.pathname === '/add-face';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 group"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 neon-glow">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm font-bold tracking-wider text-foreground neon-text">
              FACESCAN
            </span>
            <span className="text-[10px] text-muted-foreground tracking-widest">
              BLINK VERIFY
            </span>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground mr-4">
            <Shield className="h-3.5 w-3.5 text-neon-green" />
            <span>Local Processing</span>
          </div>
          <Button
            onClick={() => navigate(isAddFace ? '/' : '/add-face')}
            className={
              isAddFace
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                : 'bg-primary text-primary-foreground hover:bg-primary/80 neon-glow'
            }
          >
            {isAddFace ? (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Dashboard
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-1" />
                Add Face
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
