'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

const nav = [
  { href: '/', label: 'Dashboard', icon: '⬡' },
  { href: '/actions', label: 'Actions', icon: '◈' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* ── MOBILE: fixed top bar ── */}
      <header className="sm:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3 bg-surface-1 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-accent-purple text-xl">◈</span>
          <div>
            <p className="font-display font-bold text-xs text-white tracking-wider leading-none">AGENTIC</p>
            <p className="font-display font-bold text-xs text-accent-cyan tracking-wider leading-none">WALLET</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-surface-3 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect y="3" width="20" height="2" rx="1" />
            <rect y="9" width="20" height="2" rx="1" />
            <rect y="15" width="20" height="2" rx="1" />
          </svg>
        </button>
      </header>

      {/* ── MOBILE: drawer overlay ── */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer panel */}
          <aside className="relative w-64 max-w-[80vw] bg-surface-1 border-r border-border flex flex-col h-full z-10">
            {/* Header */}
            <div className="px-5 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-accent-purple text-2xl">◈</span>
                <div>
                  <p className="font-display font-bold text-sm text-white leading-tight tracking-wider">AGENTIC</p>
                  <p className="font-display font-bold text-sm text-accent-cyan leading-tight tracking-wider">WALLET</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-surface-3 transition-colors"
              >
                ×
              </button>
            </div>
            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-150 min-h-[44px]',
                    pathname === item.href
                      ? 'bg-accent-purple/20 text-white border border-accent-purple/40 glow-purple'
                      : 'text-slate-400 hover:text-white hover:bg-surface-3'
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="font-mono">{item.label}</span>
                </Link>
              ))}
            </nav>
            {/* Footer */}
            <div className="px-4 py-4 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-green status-live" />
                <span className="text-xs text-slate-500 font-mono">devnet</span>
              </div>
              <p className="text-[10px] text-slate-600 mt-1">⚠ prototype only</p>
            </div>
          </aside>
        </div>
      )}

      {/* ── DESKTOP: static sidebar ── */}
      <aside className="hidden sm:flex w-56 flex-shrink-0 border-r border-border flex-col bg-surface-1">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-accent-purple text-2xl">◈</span>
            <div>
              <p className="font-display font-bold text-sm text-white leading-tight tracking-wider">AGENTIC</p>
              <p className="font-display font-bold text-sm text-accent-cyan leading-tight tracking-wider">WALLET</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">devnet observer</p>
        </div>
        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 min-h-[44px]',
                pathname === item.href
                  ? 'bg-accent-purple/20 text-white border border-accent-purple/40 glow-purple'
                  : 'text-slate-400 hover:text-white hover:bg-surface-3'
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-mono">{item.label}</span>
            </Link>
          ))}
        </nav>
        {/* Footer */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-green status-live" />
            <span className="text-xs text-slate-500 font-mono">devnet</span>
          </div>
          <p className="text-[10px] text-slate-600 mt-1">⚠ prototype only</p>
        </div>
      </aside>
    </>
  );
}
