'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { useBookingStore, type TicketQuantity } from '@/store/bookingStore';

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const defaultStart = formatDateInput(new Date());
const defaultEnd = formatDateInput(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000));

const searchFormSchema = z
  .object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    adults: z.coerce.number().int().min(1, 'At least 1 adult is required').max(50),
    children: z.coerce.number().int().min(0).max(50),
    seniors: z.coerce.number().int().min(0).max(50),
    rooms: z.coerce.number().int().min(1).max(25),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

type SearchFormValues = z.infer<typeof searchFormSchema>;
type SearchFormInput = z.input<typeof searchFormSchema>;

type SearchStepProps = {
  apiBaseUrl: string;
  onResults?: () => void;
};

export function SearchStep({ apiBaseUrl, onResults }: SearchStepProps) {
  const { setSearch, setSchedules, setToast } = useBookingStore();
  const [isSearching, setIsSearching] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const form = useForm<SearchFormInput, unknown, SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      startDate: defaultStart,
      endDate: defaultEnd,
      adults: 2,
      children: 0,
      seniors: 0,
      rooms: 1,
    },
  });

  const onSubmit = async (values: SearchFormValues) => {
    const tickets: TicketQuantity[] = [
      { ticketType: 'ADULT', quantity: values.adults },
      { ticketType: 'CHILD', quantity: values.children },
      { ticketType: 'SENIOR', quantity: values.seniors },
    ];
    setSearch({ startDate: values.startDate, endDate: values.endDate, tickets });

    const params = new URLSearchParams({
      startDate: values.startDate,
      endDate: values.endDate,
      rooms: String(values.rooms),
      tickets: JSON.stringify(tickets),
    });

    setIsSearching(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/cruises/availability?${params.toString()}`);
      const payload = (await response.json()) as { schedules?: unknown[]; error?: string };
      if (!response.ok) {
        setToast(payload.error ?? 'Unable to search availability.');
        setSchedules([]);
        return;
      }

      const schedules = (payload.schedules ?? []) as never[];
      setSchedules(schedules);

      if (schedules.length === 0) {
        setToast('No voyages found for those dates. Try a wider range (e.g. next 3–6 months).');
        return;
      }

      setToast(`${schedules.length} voyage${schedules.length === 1 ? '' : 's'} found — select one below.`);
      onResults?.();
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch {
      setToast('Could not reach the booking server. Make sure npm run dev is running.');
      setSchedules([]);
    } finally {
      setIsSearching(false);
    }
  };

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--color-muted)]">
          Start date
          <input
            className="rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-text)]"
            type="date"
            {...form.register('startDate')}
          />
          {errors.startDate ? <span className="text-sm text-red-400">{errors.startDate.message}</span> : null}
        </label>
        <label className="grid gap-2 text-sm text-[var(--color-muted)]">
          End date
          <input
            className="rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-text)]"
            type="date"
            {...form.register('endDate')}
          />
          {errors.endDate ? <span className="text-sm text-red-400">{errors.endDate.message}</span> : null}
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <NumberField label="Adults" registration={form.register('adults')} error={errors.adults?.message} />
        <NumberField label="Children" registration={form.register('children')} error={errors.children?.message} />
        <NumberField label="Seniors" registration={form.register('seniors')} error={errors.seniors?.message} />
        <NumberField label="Rooms" registration={form.register('rooms')} error={errors.rooms?.message} />
      </div>
      <button
        className="rounded bg-[var(--color-accent)] px-5 py-3 text-sm font-medium uppercase tracking-[0.15em] text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isSearching}
      >
        {isSearching ? 'Searching…' : 'Search voyages'}
      </button>
      <div ref={resultsRef} aria-hidden />
    </form>
  );
}

type NumberFieldProps = {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
};

function NumberField({ label, registration, error }: NumberFieldProps) {
  return (
    <label className="grid gap-2 text-sm text-[var(--color-muted)]">
      {label}
      <input
        className="rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-text)]"
        type="number"
        min="0"
        {...registration}
      />
      {error ? <span className="text-sm text-red-400">{error}</span> : null}
    </label>
  );
}
