import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, MessageSquare, Sparkles } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Docs', href: '/docs' },
];

export function Navigation() {
  const { isAuthenticated, signOut, role } = useSupabaseAuth();
  const { settings, setTheme } = useStore();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLanding =
    location.pathname === '/' || location.hash === '#/' || location.hash === '';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('#')) {
      if (isLanding) {
        const el = document.querySelector(href);
        el?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = '/#/' + href;
      }
    }
  };

  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-6 lg:px-16 pointer-events-none"
      >
        {/* Floating pill container */}
        <motion.div
          animate={{
            boxShadow: scrolled
              ? '0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)'
              : '0 2px 16px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
          transition={{ duration: 0.3 }}
          className={cn(
            'pointer-events-auto w-full max-w-5xl',
            'flex items-center justify-between h-14 px-5',
            'rounded-2xl border border-border/60',
            'bg-card/80 backdrop-blur-xl',
            'transition-all duration-300',
          )}
        >
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <img
              src="/logonobg.png"
              alt="M-Chat Logo"
              className="w-8 h-8 transition-all duration-200 group-hover:scale-105 group-hover:drop-shadow-[0_4px_12px_rgba(99,102,241,0.4)]"
            />
            <span className="font-display font-bold text-[15px] tracking-tight text-foreground">
              M-Chat
            </span>
          </Link>

          {/* Center: Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) =>
              link.href.startsWith('#') ? (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
                  className="px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/40 inline-flex items-center justify-center"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/40 inline-flex items-center justify-center"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all inline-flex items-center justify-center h-9 w-9"
              aria-label="Toggle theme"
              title={isDark ? 'Switch to light' : 'Switch to dark'}
            >
              {isDark ? (
                <Sun size={15} strokeWidth={1.5} />
              ) : (
                <Moon size={15} strokeWidth={1.5} />
              )}
            </button>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-1">
                {role === 'admin' && (
                  <Link
                    to="/admin"
                    className="px-3 py-1.5 text-[13px] text-red-500 hover:bg-muted/40 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <Sparkles size={13} strokeWidth={1.5} />
                    Admin
                  </Link>
                )}
                <Link
                  to="/chat"
                  className="ml-1 px-4 py-2 rounded-xl text-[13px] font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-sm shadow-indigo-500/30 inline-flex items-center gap-1.5 h-9"
                >
                  <MessageSquare size={13} strokeWidth={1.5} />
                  Open Chat
                </Link>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors inline-flex items-center justify-center h-9"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-foreground text-background hover:opacity-90 transition-opacity inline-flex items-center justify-center h-9"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted/40 transition-colors ml-1 inline-flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X size={18} strokeWidth={1.5} />
              ) : (
                <Menu size={18} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </motion.div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden bg-background"
          >
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 mb-4"
              >
                <img src="/logonobg.png" alt="M-Chat Logo" className="w-8 h-8" />
                <span className="font-display font-bold text-lg text-foreground">M-Chat</span>
              </Link>

              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
                  className="text-xl font-display font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </button>
              ))}

              <div className="border-t border-border pt-8 mt-4 flex flex-col gap-3 items-center w-full max-w-xs px-6">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/chat"
                      onClick={() => setMobileOpen(false)}
                      className="w-full py-3 rounded-xl bg-indigo-500 text-white text-sm font-semibold text-center"
                    >
                      Open Chat
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileOpen(false);
                      }}
                      className="text-sm text-red-500"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="w-full py-3 rounded-xl bg-foreground text-background text-sm font-semibold text-center"
                    >
                      Get Started
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Log in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}