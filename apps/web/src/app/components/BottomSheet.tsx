'use client';
import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import type { ActionRecord } from '../lib/api';
import { StatusBadge } from './StatusBadge';

interface BottomSheetProps {
  action: ActionRecord | null;
  onClose: () => void;
}

export function BottomSheet({ action, onClose }: BottomSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!action) return;

    // Focus close button for keyboard accessibility
    setTimeout(() => closeRef.current?.focus(), 50);

    // ESC to close
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);

    // Auto-close success after 5s
    let t: ReturnType<typeof setTimeout>;
    if (action.status === 'SUCCESS') {
      t = setTimeout(onClose, 5000);
    }

    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [action, onClose]);

  if (!action) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Transaction Details"
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface-2 border-t border-border rounded-t-2xl shadow-2xl sheet-enter max-h-[85vh] flex flex-col"
      >
        {/* Handle bar */}
        <div className="flex-shrink-0 pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 pb-6 sm:pb-8 pt-2">
          {/* Max width on large screens */}
          <div className="max-w-lg mx-auto">
            <div className="flex items-start justify-between mb-4 sm:mb-5">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-white">Transaction Details</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{action.type.replace('ACTION_', '')}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={action.status} />
                <button
                  ref={closeRef}
                  onClick={onClose}
                  aria-label="Close"
                  className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-white transition-colors text-xl leading-none rounded-lg hover:bg-surface-3 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {action.signature && (
                <div className="bg-surface-3 rounded-lg p-3 border border-border">
                  <p className="text-[10px] text-slate-500 mb-1 tracking-widest">SIGNATURE</p>
                  <p className="font-mono text-xs text-accent-cyan break-all">{action.signature}</p>
                </div>
              )}

              {action.explorerUrl && (
                <a
                  href={action.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent-purple/20 border border-accent-purple/40 text-accent-purple text-sm font-mono hover:bg-accent-purple/30 transition-colors w-full justify-center min-h-[44px]"
                >
                  <span>↗</span> View on Solana Explorer
                </a>
              )}

              {action.error && (
                <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3">
                  <p className="text-[10px] text-accent-red mb-1 tracking-widest">ERROR</p>
                  <p className="text-xs text-red-300 font-mono break-all">{action.error}</p>
                </div>
              )}

              <div className={clsx('grid gap-3 text-xs', action.amount !== null ? 'grid-cols-2' : 'grid-cols-1')}>
                {action.amount !== null && (
                  <div className="bg-surface-3 rounded-lg p-3 border border-border">
                    <p className="text-[10px] text-slate-500 tracking-widest mb-1">AMOUNT</p>
                    <p className="font-mono text-white">{action.amount.toLocaleString()}</p>
                  </div>
                )}
                <div className="bg-surface-3 rounded-lg p-3 border border-border">
                  <p className="text-[10px] text-slate-500 tracking-widest mb-1">STARTED</p>
                  <p suppressHydrationWarning className="font-mono text-white">
                    {new Date(action.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </p>
                </div>
              </div>

              {action.status === 'SUCCESS' && (
                <p className="text-center text-xs text-slate-500 font-mono">Auto-closing in 5s…</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
