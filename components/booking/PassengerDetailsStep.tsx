'use client';

import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useBookingStore, type PassengerDraft, type TicketTypeName } from '@/store/bookingStore';

const passengerFormSchema = z.object({
  passengers: z.array(
    z.object({
      roomId: z.string().optional(),
      first_name: z.string().min(1, 'First name is required'),
      last_name: z.string().min(1, 'Last name is required'),
      date_of_birth: z.string().min(1, 'Date of birth is required'),
      ticket_type: z.enum(['ADULT', 'CHILD', 'SENIOR']),
    }),
  ),
});

type PassengerFormValues = z.infer<typeof passengerFormSchema>;

export function PassengerDetailsStep() {
  const { tickets, selectedRooms, passengers, setPassengers, setStep } = useBookingStore();
  const generatedPassengers = useMemo(() => {
    const rows: PassengerDraft[] = [];
    tickets.forEach((ticket) => {
      for (let i = 0; i < ticket.quantity; i += 1) {
        rows.push({
          first_name: '',
          last_name: '',
          date_of_birth: '',
          ticket_type: ticket.ticketType,
          roomId: selectedRooms[i % Math.max(1, selectedRooms.length)]?.id,
        });
      }
    });
    return rows;
  }, [selectedRooms, tickets]);

  const form = useForm<PassengerFormValues>({
    resolver: zodResolver(passengerFormSchema),
    defaultValues: { passengers: passengers.length > 0 ? passengers : generatedPassengers },
  });
  const fieldArray = useFieldArray({ control: form.control, name: 'passengers' });

  useEffect(() => {
    if (passengers.length === 0 && generatedPassengers.length > 0) {
      form.reset({ passengers: generatedPassengers });
    }
  }, [form, generatedPassengers, passengers.length]);

  const onSubmit = (values: PassengerFormValues) => {
    setPassengers(values.passengers);
    setStep(4);
  };

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
      {fieldArray.fields.map((field, index) => (
        <div key={field.id} className="rounded border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
          <p className="mb-4 text-sm font-medium text-[var(--color-accent)]">Passenger {index + 1}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded border border-[var(--color-border)] bg-transparent px-3 py-2 text-[var(--color-text)]" placeholder="First name" {...form.register(`passengers.${index}.first_name`)} />
            <input className="rounded border border-[var(--color-border)] bg-transparent px-3 py-2 text-[var(--color-text)]" placeholder="Last name" {...form.register(`passengers.${index}.last_name`)} />
            <input className="rounded border border-[var(--color-border)] bg-transparent px-3 py-2 text-[var(--color-text)]" type="date" {...form.register(`passengers.${index}.date_of_birth`)} />
            <select className="rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-[var(--color-text)]" {...form.register(`passengers.${index}.ticket_type`)}>
              {(['ADULT', 'CHILD', 'SENIOR'] satisfies TicketTypeName[]).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select className="rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-[var(--color-text)] md:col-span-2" {...form.register(`passengers.${index}.roomId`)}>
              <option value="">Unassigned</option>
              {selectedRooms.map((room) => (
                <option key={room.id} value={room.id}>Room {room.room_number}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
      <button className="rounded bg-[var(--color-accent)] px-5 py-3 text-sm font-medium uppercase tracking-[0.15em] text-[var(--color-primary)]" type="submit">
        Review booking
      </button>
    </form>
  );
}
