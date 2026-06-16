'use client';

import { useMemo } from 'react';
import { useBookingStore } from '@/store/bookingStore';

type RoomSelectionStepProps = {
  apiBaseUrl: string;
};

export function RoomSelectionStep({ apiBaseUrl }: RoomSelectionStepProps) {
  const {
    schedules,
    selectedSchedule,
    selectedRooms,
    tickets,
    selectSchedule,
    toggleRoom,
    setHold,
    setStep,
    setToast,
  } = useBookingStore();

  const rooms = selectedSchedule?.availableRooms ?? [];
  const selectedRoomIds = useMemo(() => new Set(selectedRooms.map((room) => room.id)), [selectedRooms]);

  const createHold = async () => {
    if (!selectedSchedule || selectedRooms.length === 0) {
      setToast('Select a voyage and at least one room.');
      return;
    }
    const response = await fetch(`${apiBaseUrl}/api/bookings/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduleId: selectedSchedule.schedule.id,
        roomIds: selectedRooms.map((room) => room.id),
        tickets,
      }),
    });
    const payload = (await response.json()) as { bookingId?: string; hold_expires_at?: string; error?: string };
    if (!response.ok || !payload.bookingId || !payload.hold_expires_at) {
      setToast(payload.error ?? 'Unable to hold rooms.');
      return;
    }
    setHold({ bookingId: payload.bookingId, holdExpiresAt: payload.hold_expires_at });
    setStep(3);
  };

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <h3 className="text-xl font-medium text-[var(--color-text)]">Available voyages</h3>
        <div className="grid gap-3">
          {schedules.map((item) => (
            <button
              key={item.schedule.id}
              type="button"
              onClick={() => selectSchedule(item)}
              className={`rounded border p-4 text-left transition ${
                selectedSchedule?.schedule.id === item.schedule.id
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                  : 'border-[var(--color-border)] bg-[var(--color-panel)]'
              }`}
            >
              <p className="text-[var(--color-text)]">{item.schedule.cruise.name}</p>
              <p className="text-sm text-[var(--color-muted)]">
                {new Date(item.schedule.departure_time).toUTCString()} · {item.availableRooms.length} rooms available
              </p>
              <p className="font-mono text-sm text-[var(--color-accent)]">${item.estimatedPrice.total.toFixed(2)} estimated</p>
            </button>
          ))}
        </div>
      </div>

      {selectedSchedule ? (
        <div className="grid gap-4">
          <h3 className="text-xl font-medium text-[var(--color-text)]">Select rooms</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => toggleRoom(room)}
                className={`rounded border p-4 text-left transition ${
                  selectedRoomIds.has(room.id)
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                    : 'border-[var(--color-border)] bg-[var(--color-panel)]'
                }`}
              >
                <p className="font-medium text-[var(--color-text)]">Room {room.room_number}</p>
                <p className="text-sm text-[var(--color-muted)]">{room.room_type.replace('_', ' ')} · Sleeps {room.capacity}</p>
                <p className="font-mono text-sm text-[var(--color-accent)]">× {room.price_multiplier.toFixed(2)}</p>
              </button>
            ))}
          </div>
          <button type="button" onClick={createHold} className="rounded bg-[var(--color-accent)] px-5 py-3 text-sm font-medium uppercase tracking-[0.15em] text-[var(--color-primary)]">
            Hold selected rooms
          </button>
        </div>
      ) : null}
    </div>
  );
}
