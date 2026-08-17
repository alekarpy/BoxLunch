import { motion } from 'motion/react';
import { Lock, Sparkles, ChefHat, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';


const Orb = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

export function PantallaLogin() {
  const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    return '/api';
  };

  useEffect(() => {
    // Capture error messages from URL (e.g. redirected by backend on AuthFailed)
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('message');
    if (errorMsg) {
      toast.error('Error de autenticación', {
        description: errorMsg,
        duration: 8000,
      });
      // Clear URL query parameters to avoid showing error on reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLoginRedirect = (role: string) => {
    const apiUrl = getApiUrl();
    window.location.href = `${apiUrl}/auth/mock-login?role=${role}`;
  };

  return (
    <main className="w-full overflow-hidden bg-background grain-texture flex items-center justify-center">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <Orb className="left-[8%] top-[6%] h-96 w-96 bg-primary/10" delay={0} />
        <Orb className="bottom-[8%] right-[6%] h-[28rem] w-[28rem] bg-accent/10" delay={2.5} />
        <Orb className="bottom-[30%] left-[55%] h-56 w-56 bg-primary/6" delay={1.2} />

        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Centered content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[540px]"
        >
          <section
            className="
              relative w-full overflow-hidden
              rounded-[32px]
              border border-white/10
              bg-background/80
              px-8 py-9
              shadow-[0_32px_80px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.05)]
              backdrop-blur-2xl
            "
          >
            {/* Internal glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/15 via-transparent to-transparent" />

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto mb-7 flex h-20 w-20 items-center justify-center"
            >
              <div
                className="
                  absolute inset-0 flex items-center justify-center
                  rounded-[24px]
                  bg-gradient-to-br from-primary/20 via-transparent to-accent/20
                  p-px
                "
              >
                <div className="flex h-full w-full items-center justify-center rounded-[23px] bg-background/90 backdrop-blur-sm">
                  <ChefHat className="h-10 w-10 text-primary" strokeWidth={1.5} />
                </div>
              </div>
            </motion.div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.35 }}
              className="text-center"
            >
              {/* gap-2 */}
              <div className="mb-1 flex items-center justify-center gap-2">
                <span
                  className="text-[1.65rem] font-semibold tracking-tight text-foreground"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  BoxLunch
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span
                  className="text-[1.65rem] font-semibold tracking-tight text-muted-foreground"
                  style={{ fontFamily: 'var(--font-display)' }}
                >

                </span>
              </div>

              <p className="mx-auto mt-2.5 max-w-[260px] text-[13px] leading-[1.65] text-muted-foreground/80">
                Selecciona un rol a continuación para explorar las distintas vistas del sistema en modo demostración.
              </p>
            </motion.div>

            {/* Separator */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.6 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.26, duration: 0.4, ease: 'easeOut' }}
              className="my-7 flex items-center gap-3"
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/60" />
              <Sparkles className="h-3 w-3 text-muted-foreground/30" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/60" />
            </motion.div>

            {/* Microsoft button */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.35 }}
            >
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleLoginRedirect('Admin')}
                  className="
                    group relative flex w-full items-center justify-center gap-3
                    overflow-hidden rounded-2xl border border-border/50 bg-white/[0.06] px-4 py-3.5
                    text-sm font-medium text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.1)]
                    backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30
                    hover:bg-white/[0.10] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.15)]
                    active:scale-[0.985] active:translate-y-0
                  "
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Entrar como Administrador</span>
                </button>

                <button
                  onClick={() => handleLoginRedirect('Operativo')}
                  className="
                    group relative flex w-full items-center justify-center gap-3
                    overflow-hidden rounded-2xl border border-border/50 bg-white/[0.06] px-4 py-3.5
                    text-sm font-medium text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.1)]
                    backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30
                    hover:bg-white/[0.10] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.15)]
                    active:scale-[0.985] active:translate-y-0
                  "
                >
                  <ChefHat className="h-4 w-4 text-orange-500" />
                  <span>Entrar como Operativo (Cocina)</span>
                </button>

                <button
                  onClick={() => handleLoginRedirect('Desarrollador')}
                  className="
                    group relative flex w-full items-center justify-center gap-3
                    overflow-hidden rounded-2xl border border-border/50 bg-white/[0.06] px-4 py-3.5
                    text-sm font-medium text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.1)]
                    backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30
                    hover:bg-white/[0.10] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.15)]
                    active:scale-[0.985] active:translate-y-0
                  "
                >
                  <User className="h-4 w-4 text-blue-500" />
                  <span>Entrar como Desarrollador</span>
                </button>
              </div>
            </motion.div>

            {/* Security footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.42, duration: 0.4 }}
              className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/50"
            >
              <Lock className="h-3 w-3" />
              <span>Modo Demostración sin conexión a Entra ID</span>
            </motion.div>
          </section>

          {/* Decorative reflection */}
          <div className="mx-auto mt-3 h-6 w-3/4 rounded-full bg-primary/5 blur-xl" />
        </motion.div>
      </div>
    </main>
  );
}