import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, MessageSquare, Sparkles } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Docs', href: '/docs' },
];

export function Navigation() {
  const { isAuthenticated, signOut, role } = useSupabaseAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const isLanding = location.pathname === '/' || location.hash === '#/' || location.hash === '';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.remove('light');
    else root.classList.add('light');
  }, [isDark]);

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

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        )}
      >
        {/* Nav container with frosted glass */}
        <div
          className={cn(
            'mx-auto mt-3 max-w-5xl transition-all duration-500',
            scrolled
              ? 'bg-[#080810]/85 backdrop-blur-xl border border-white/[0.07] rounded-2xl shadow-lg shadow-black/30 mx-4 md:mx-auto'
              : 'bg-transparent mx-4 md:mx-auto'
          )}
        >
          <div className="flex items-center justify-between h-14 px-5 relative w-full">
            {/* Left Side: Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                <img src="/logonobg.png" alt="M-Chat Logo" className="w-8 h-8 transition-all duration-200 group-hover:scale-105 group-hover:drop-shadow-[0_4px_12px_rgba(99,102,241,0.4)]" />
                <span className="font-display font-bold text-[15px] tracking-tight text-[var(--m-text-primary)]">
                  M-Chat
                </span>
              </Link>
            </div>

            {/* Center: Desktop Nav */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                link.href.startsWith('#') ? (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.href)}
                    className="px-3 py-2 text-[13px] font-medium text-[var(--m-text-secondary)] hover:text-[var(--m-text-primary)] transition-colors rounded-lg hover:bg-white/[0.04] inline-flex items-center justify-center h-9"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="px-3 py-2 text-[13px] font-medium text-[var(--m-text-secondary)] hover:text-[var(--m-text-primary)] transition-colors rounded-lg hover:bg-white/[0.04] inline-flex items-center justify-center h-9"
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Theme toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] hover:bg-white/[0.05] transition-all inline-flex items-center justify-center h-9 w-9"
                aria-label="Toggle theme"
              >
                {isDark
                  ? <Sun size={15} strokeWidth={1.5} />
                  : <Moon size={15} strokeWidth={1.5} />
                }
              </button>

              {isAuthenticated ? (
                <div className="hidden sm:flex items-center gap-1">
                  {role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-3 py-1.5 text-[13px] text-[var(--m-accent-red)] hover:bg-white/[0.04] rounded-lg transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={13} strokeWidth={1.5} />
                        Admin
                      </span>
                    </Link>
                  )}
                  <Link
                    to="/chat"
                    className="ml-1 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[var(--m-accent-blue)] text-white hover:bg-[#4f52e0] transition-all shadow-sm shadow-[var(--m-accent-blue)]/30 inline-flex items-center justify-center h-9"
                  >
                    <span className="flex items-center gap-1.5">
                      <MessageSquare size={13} strokeWidth={1.5} />
                      Open Chat
                    </span>
                  </Link>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-[13px] font-medium text-[var(--m-text-secondary)] hover:text-[var(--m-text-primary)] hover:bg-white/[0.04] rounded-lg transition-colors inline-flex items-center justify-center h-9"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-[var(--m-text-primary)] text-[var(--m-text-inverse)] hover:opacity-90 transition-opacity inline-flex items-center justify-center h-9"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-[var(--m-text-secondary)] hover:bg-white/[0.04] transition-colors ml-1"
              >
                {mobileOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ backgroundColor: 'var(--m-bg-base)' }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-6">
              {/* Logo */}
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 mb-4">
                <img src="/logonobg.png" alt="M-Chat Logo" className="w-8 h-8" />
                <span className="font-display font-bold text-lg text-[var(--m-text-primary)]">M-Chat</span>
              </Link>

              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
                  className="text-xl font-display font-semibold text-[var(--m-text-secondary)] hover:text-[var(--m-text-primary)] transition-colors"
                >
                  {link.label}
                </button>
              ))}

              <div className="border-t border-white/[0.06] pt-8 mt-4 flex flex-col gap-3 items-center w-full max-w-xs px-6">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/chat"
                      onClick={() => setMobileOpen(false)}
                      className="w-full py-3 rounded-xl bg-[var(--m-accent-blue)] text-white text-sm font-semibold text-center"
                    >
                      Open Chat
                    </Link>
                    <button
                      onClick={() => { signOut(); setMobileOpen(false); }}
                      className="text-sm text-[var(--m-accent-red)]"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="w-full py-3 rounded-xl bg-[var(--m-text-primary)] text-[var(--m-text-inverse)] text-sm font-semibold text-center"
                    >
                      Get Started
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm text-[var(--m-text-secondary)] hover:text-[var(--m-text-primary)] transition-colors"
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
