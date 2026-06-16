'use client';

import { useMemo } from 'react';
import { useBookingStore } from '@/store/bookingStore';

type ReviewStepProps = {
  apiBaseUrl: string;
};

export function ReviewStep({ apiBaseUrl }: ReviewStepProps) {
  const {
    selectedSchedule,
    selectedRooms,
    passengers,
    bookingId,
    secondsRemaining,
    ensureIdempotencyKey,
    setToast,
    reset,
  } = useBookingStore();

  const estimate = selectedSchedule?.estimatedPrice;
  const holdTime = useMemo(() => {
    const minutes = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
    const seconds = (secondsRemaining % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [secondsRemaining]);

  const confirm = async () => {
    if (!bookingId) {
      setToast('No active hold found.');
      return;
    }
    const response = await fetch(`${apiBaseUrl}/api/bookings/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        idempotency_key: ensureIdempotencyKey(),
        passengers,
      }),
    });
    const payload = (await response.json()) as { error?: string; booking?: { id: string } };
    if (!response.ok) {
      setToast(payload.error ?? 'Unable to confirm booking.');
      return;
    }
    setToast(`Booking confirmed: ${payload.booking?.id ?? bookingId}`);
    reset();
  };

  return (
    <div className="grid gap-6">
      <div className="rounded border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4 text-sm text-[var(--color-text)]">
        Your rooms are held for <span className="font-mono text-[var(--color-accent)]">{holdTime}</span>
      </div>
      <div className="rounded border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
        <h3 className="mb-4 text-xl font-medium text-[var(--color-text)]">Review voyage</h3>
        <p className="text-[var(--color-text)]">{selectedSchedule?.schedule.cruise.name}</p>
        <p className="text-sm text-[var(--color-muted)]">{selectedRooms.length} room(s) · {passengers.length} passenger(s)</p>
        <ul className="mt-4 grid gap-2 text-sm text-[var(--color-muted)]">
          {selectedRooms.map((room) => (
            <li key={room.id}>Room {room.room_number} · {room.room_type.replace('_', ' ')}</li>
          ))}
        </ul>
      </div>
      {estimate ? (
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-panel)] p-5 font-mono text-sm text-[var(--color-text)]">
          <div className="flex justify-between"><span>Rooms</span><span>${estimate.roomSubtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tickets</span><span>${estimate.ticketSubtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Taxes / fees</span><span>${estimate.taxesAndFees.toFixed(2)}</span></div>
          <div className="mt-3 flex justify-between border-t border-[var(--color-border)] pt-3 text-base text-[var(--color-accent)]"><span>Total</span><span>${estimate.total.toFixed(2)}</span></div>
        </div>
      ) : null}
      <label className="flex items-start gap-3 text-sm text-[var(--color-muted)]">
        <input className="mt-1" type="checkbox" required />
        I accept the voyage terms, cancellation policy, and passenger manifest requirements.
      </label>
      <button onClick={confirm} className="rounded bg-[var(--color-accent)] px-5 py-3 text-sm font-medium uppercase tracking-[0.15em] text-[var(--color-primary)]" type="button">
        Mock payment & confirm
      </button>
    </div>
  );
}
