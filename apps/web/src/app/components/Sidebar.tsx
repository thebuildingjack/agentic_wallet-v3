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
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);

  function openDrawer() {
    setRendered(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }

  function closeDrawer() {
    setVisible(false);
    setTimeout(() => setRendered(false), 320);
  }

  useEffect(() => {
    closeDrawer();
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* MOBILE: fixed top bar */}
      <header className="sm:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3 bg-surface-1 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-accent-purple text-xl">◈</span>
          <div>
            <p className="font-display font-bold text-xs text-white tracking-wider leading-none">AGENTIC</p>
            <p className="font-display font-bold text-xs text-accent-cyan tracking-wider leading-none">WALLET</p>
          </div>
        </div>
        <button
          onClick={openDrawer}
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

      {/* MOBILE: animated drawer */}
      {rendered && (
        <div className="sm:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          {/* Backdrop — fades in/out */}
          <div
            onClick={closeDrawer}
            style={{ transition: 'opacity 300ms ease' }}
            className={clsx(
              'absolute inset-0 bg-black/70 backdrop-blur-sm',
              visible ? 'opacity-100' : 'opacity-0'
            )}
          />

          {/* Drawer panel — slides in from left */}
          <aside
            style={{ transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)' }}
            className={clsx(
              'relative w-64 max-w-[80vw] bg-surface-1 border-r border-border flex flex-col h-full z-10',
              visible ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <div className="px-5 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-accent-purple text-2xl">◈</span>
                <div>
                  <p className="font-display font-bold text-sm text-white leading-tight tracking-wider">AGENTIC</p>
                  <p className="font-display font-bold text-sm text-accent-cyan leading-tight tracking-wider">WALLET</p>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                aria-label="Close menu"
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-surface-3 transition-colors text-xl"
              >
                ×
              </button>
            </div>

            {/* Nav items — staggered fade + slide up */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {nav.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    transition: `opacity 250ms ease ${i * 60 + 120}ms, transform 250ms ease ${i * 60 + 120}ms`,
                  }}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm min-h-[44px]',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
                    pathname === item.href
                      ? 'bg-accent-purple/20 text-white border border-accent-purple/40 glow-purple'
                      : 'text-slate-400 hover:text-white hover:bg-surface-3 transition-colors duration-150'
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="font-mono">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Footer — fades in with delay */}
            <div
              style={{ transition: 'opacity 250ms ease 240ms' }}
              className={clsx(
                'px-4 py-4 border-t border-border',
                visible ? 'opacity-100' : 'opacity-0'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-green status-live" />
                <span className="text-xs text-slate-500 font-mono">devnet</span>
              </div>
              <p className="text-[10px] text-slate-600 mt-1">⚠ prototype only</p>
            </div>
          </aside>
        </div>
      )}

      {/* DESKTOP: static sidebar */}
      <aside className="hidden sm:flex w-56 flex-shrink-0 border-r border-border flex-col bg-surface-1">
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
