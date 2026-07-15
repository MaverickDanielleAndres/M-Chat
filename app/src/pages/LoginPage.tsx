import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  LogIn, Lock, Loader2, Eye, EyeOff, Wand2, ChevronLeft, AtSign,
} from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { cn } from '@/lib/utils';

/* ─── FloatingPaths (from auth-page spec) ──────────────── */
function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg className="h-full w-full text-white" viewBox="0 0 696 316" fill="none">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.06 + path.id * 0.015}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

/* ─── Google SVG icon ─────────────────────────────────── */
function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AuthSeparator() {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="h-px w-full bg-border" />
      <span className="px-3 text-xs text-[var(--m-text-muted)] whitespace-nowrap">OR</span>
      <div className="h-px w-full bg-border" />
    </div>
  );
}

/* ─── Main LoginPage ──────────────────────────────────── */
export function LoginPage() {
  const { signIn, signInWithGoogle, signInWithMagicLink } = useSupabaseAuth();
  const [email, setEmail] = useState('user@gmail.com');
  const [password, setPassword] = useState('P@ssword123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicMode, setMagicMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);
    try {
      if (magicMode) {
        const { error } = await signInWithMagicLink(email);
        if (error) throw error;
        setSuccess('Magic link sent! Check your email.');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        window.location.href = '/#/chat';
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally { setIsLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError('');
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2" style={{ backgroundColor: 'var(--m-bg-base)' }}>

      {/* ── Left panel ──────────────────────────────── */}
      <div className="relative hidden h-full flex-col border-r border-white/[0.06] p-10 lg:flex overflow-hidden bg-[#07070d]">
        {/* Gradient overlay bottom-to-top */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#07070d] via-transparent to-transparent" />

        {/* Logo */}
        <Link to="/" className="z-20 flex items-center gap-2.5">
          <img src="/logonobg.png" alt="M-Chat Logo" className="w-9 h-9" />
          <span className="font-display font-bold text-lg text-white">M-Chat</span>
        </Link>

        {/* Floating paths animation */}
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        {/* Quote */}
        <div className="z-20 mt-auto">
          <blockquote className="space-y-3">
            <p className="text-[18px] leading-relaxed text-white/80 font-light">
              &ldquo;M-Chat transformed how I write code. The accuracy is
              outstanding — it feels like having a senior engineer on call.&rdquo;
            </p>
            <footer className="font-mono text-sm font-semibold text-[var(--m-accent-blue)]">
              ~ Sarah Chen, Software Engineer @ Stripe
            </footer>
          </blockquote>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────── */}
      <div className="relative flex h-screen overflow-y-auto flex-col p-6 sm:p-10">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-[var(--m-accent-blue)]/5 blur-3xl -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-[#a78bfa]/5 blur-3xl translate-y-1/3 -translate-x-1/3" />
        </div>

        {/* Back home */}
        <Link
          to="/"
          className="absolute top-6 left-6 flex items-center gap-1.5 text-[13px] text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] transition-colors"
        >
          <ChevronLeft size={15} strokeWidth={1.5} />
          Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mx-auto w-full max-w-sm space-y-4 my-auto py-12"
        >
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden mb-2">
            <img src="/logonobg.png" alt="M-Chat Logo" className="w-8 h-8" />
            <span className="font-display font-bold text-lg text-[var(--m-text-primary)]">M-Chat</span>
          </Link>

          {/* Heading */}
          <div className="space-y-1 mt-6 text-center">
            <h1 className="font-display text-[22px] font-bold text-[var(--m-text-primary)] tracking-tight">
              {magicMode ? 'Magic link sign in' : 'Welcome back'}
            </h1>
            <p className="text-[14px] text-[var(--m-text-muted)]">
              {magicMode
                ? 'Get a login link sent to your email.'
                : 'Sign in to your M-Chat account.'}
            </p>
          </div>

          {/* Error / success */}
          {error && (
            <div className="p-3 rounded-xl text-[13px] text-[var(--m-accent-red)] bg-red-500/5 border border-red-500/10">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl text-[13px] text-[var(--m-accent-green)] bg-green-500/5 border border-green-500/10">
              {success}
            </div>
          )}

          {/* OAuth buttons */}
          {!magicMode && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-[13px] font-medium border border-border text-[var(--m-text-primary)] hover:bg-muted hover:border-foreground/20 transition-all disabled:opacity-50"
              >
                {googleLoading
                  ? <Loader2 size={15} className="animate-spin" />
                  : <GoogleIcon width={16} height={16} />
                }
                Continue with Google
              </button>
            </div>
          )}

          {!magicMode && <AuthSeparator />}

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-[12px] text-[var(--m-text-muted)]">
              {magicMode ? 'Enter your email to receive a magic link' : 'Or sign in with email and password'}
            </p>

            {/* Email */}
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] border border-border bg-transparent text-[var(--m-text-primary)] placeholder:text-[var(--m-text-muted)] outline-none focus:border-[var(--m-accent-blue)]/40 focus:bg-background transition-all"
              />
              <AtSign size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m-text-muted)]" />
            </div>

            {/* Password */}
            {!magicMode && (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-[13px] border border-border bg-transparent text-[var(--m-text-primary)] placeholder:text-[var(--m-text-muted)] outline-none focus:border-[var(--m-accent-blue)]/40 focus:bg-background transition-all"
                />
                <Lock size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m-text-muted)]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--m-text-muted)] hover:text-[var(--m-text-secondary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all',
                'bg-[var(--m-accent-blue)] text-white hover:bg-[#4f52e0] shadow-md shadow-[var(--m-accent-blue)]/25',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isLoading
                ? <Loader2 size={14} className="animate-spin" />
                : magicMode
                  ? <Wand2 size={14} strokeWidth={1.5} />
                  : <LogIn size={14} strokeWidth={1.5} />
              }
              {isLoading ? 'Please wait…' : magicMode ? 'Send Magic Link' : 'Sign In'}
            </button>
          </form>

          {/* Links */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <button
              onClick={() => { setMagicMode(!magicMode); setError(''); setSuccess(''); }}
              className="text-[12px] text-[var(--m-accent-blue)] hover:underline"
            >
              {magicMode ? 'Sign in with password instead' : 'Sign in with magic link'}
            </button>
            {!magicMode && (
              <Link to="/forgot-password" className="text-[12px] text-[var(--m-text-muted)] hover:text-[var(--m-text-secondary)] transition-colors">
                Forgot password?
              </Link>
            )}
          </div>

          {/* Terms */}
          <p className="text-[11px] text-[var(--m-text-muted)] text-center leading-relaxed pt-1">
            By continuing, you agree to our{' '}
            <a href="#" className="hover:text-[var(--m-text-secondary)] underline underline-offset-2">Terms</a>
            {' '}and{' '}
            <a href="#" className="hover:text-[var(--m-text-secondary)] underline underline-offset-2">Privacy Policy</a>.
          </p>

          {/* Switch to signup */}
          <p className="text-center text-[13px] text-[var(--m-text-muted)]">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-[var(--m-accent-blue)] font-medium hover:underline">
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
