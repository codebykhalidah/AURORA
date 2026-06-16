'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { SearchStep } from './SearchStep';
import { RoomSelectionStep } from './RoomSelectionStep';
import { PassengerDetailsStep } from './PassengerDetailsStep';
import { ReviewStep } from './ReviewStep';
import { useBookingStore } from '@/store/bookingStore';

export type BookingWidgetTheme = {
  primary?: string;
  panel?: string;
  text?: string;
  muted?: string;
  accent?: string;
  accentSoft?: string;
  border?: string;
  fontFamily?: string;
};

type CruiseBookingWidgetProps = {
  apiBaseUrl?: string;
  theme?: BookingWidgetTheme;
  authToken?: string;
};

const defaultTheme: Required<BookingWidgetTheme> = {
  primary: '#0a0a0a',
  panel: '#111111',
  text: '#ffffff',
  muted: 'rgba(255,255,255,0.6)',
  accent: '#c9a96e',
  accentSoft: 'rgba(201,169,110,0.1)',
  border: 'rgba(255,255,255,0.12)',
  fontFamily: 'Inter, sans-serif',
};

export function CruiseBookingWidget({ apiBaseUrl = '', theme, authToken: _authToken }: CruiseBookingWidgetProps) {
  const { step, toast, setToast, tickHold, holdExpiresAt, schedules, setStep } = useBookingStore();
  const mergedTheme = { ...defaultTheme, ...theme };
  const resultsAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!holdExpiresAt) return;
    const interval = window.setInterval(tickHold, 1000);
    return () => window.clearInterval(interval);
  }, [holdExpiresAt, tickHold]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), 4500);
    return () => window.clearTimeout(timer);
  }, [setToast, toast]);

  useEffect(() => {
    if (schedules.length === 0) return;
    resultsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [schedules.length]);

  return (
    <section
      className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary)] p-4 text-[var(--color-text)] shadow-2xl md:p-8"
      style={{
        '--color-primary': mergedTheme.primary,
        '--color-panel': mergedTheme.panel,
        '--color-text': mergedTheme.text,
        '--color-muted': mergedTheme.muted,
        '--color-accent': mergedTheme.accent,
        '--color-accent-soft': mergedTheme.accentSoft,
        '--color-border': mergedTheme.border,
        fontFamily: mergedTheme.fontFamily,
      } as CSSProperties}
      aria-label="Cruise booking widget"
    >
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Aurora Maritime</p>
          <h2 className="mt-2 text-2xl font-medium text-[var(--color-text)]">Reserve a boutique cruise</h2>
        </div>
        <div className="flex gap-2 text-xs">
          {[1, 2, 3, 4].map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setStep(candidate as 1 | 2 | 3 | 4)}
              className={`h-8 w-8 rounded-full border ${
                step === candidate ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-muted)]'
              }`}
              aria-label={`Go to step ${candidate}`}
            >
              {candidate}
            </button>
          ))}
        </div>
      </div>

      {step === 1 ? <SearchStep apiBaseUrl={apiBaseUrl} onResults={() => resultsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} /> : null}
      {step === 1 && schedules.length > 0 ? (
        <div ref={resultsAnchorRef} className="mt-8">
          <RoomSelectionStep apiBaseUrl={apiBaseUrl} />
        </div>
      ) : null}
      {step === 2 ? <RoomSelectionStep apiBaseUrl={apiBaseUrl} /> : null}
      {step === 3 ? <PassengerDetailsStep /> : null}
      {step === 4 ? <ReviewStep apiBaseUrl={apiBaseUrl} /> : null}

      {toast ? (
        <div className="absolute bottom-4 left-1/2 z-50 w-[min(100%,28rem)] -translate-x-1/2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-center text-sm font-medium text-[var(--color-primary)] shadow-xl" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </section>
  );
}
