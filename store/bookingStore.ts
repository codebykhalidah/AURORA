'use client';

import { create } from 'zustand';

export type TicketTypeName = 'ADULT' | 'CHILD' | 'SENIOR';

export type TicketQuantity = {
  ticketType: TicketTypeName;
  quantity: number;
};

export type AvailableRoom = {
  id: string;
  room_number: string;
  room_type: 'INTERIOR' | 'OCEAN_VIEW' | 'SUITE';
  price_multiplier: number;
  capacity: number;
};

export type AvailableSchedule = {
  schedule: {
    id: string;
    departure_time: string;
    arrival_time: string;
    cruise: {
      id: string;
      name: string;
      base_price: string;
      departure_port: string;
      arrival_port: string;
    };
  };
  availableRooms: AvailableRoom[];
  estimatedPrice: {
    roomSubtotal: number;
    ticketSubtotal: number;
    taxesAndFees: number;
    total: number;
    nights: number;
  };
};

export type PassengerDraft = {
  roomId?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  ticket_type: TicketTypeName;
};

type BookingStep = 1 | 2 | 3 | 4;

type BookingState = {
  step: BookingStep;
  startDate: string;
  endDate: string;
  departureTime?: string;
  tickets: TicketQuantity[];
  schedules: AvailableSchedule[];
  selectedSchedule?: AvailableSchedule;
  selectedRooms: AvailableRoom[];
  passengers: PassengerDraft[];
  bookingId?: string;
  holdExpiresAt?: string;
  idempotencyKey?: string;
  toast?: string;
  secondsRemaining: number;
  setStep: (step: BookingStep) => void;
  setSearch: (input: { startDate: string; endDate: string; departureTime?: string; tickets: TicketQuantity[] }) => void;
  setSchedules: (schedules: AvailableSchedule[]) => void;
  selectSchedule: (schedule: AvailableSchedule) => void;
  toggleRoom: (room: AvailableRoom) => void;
  setPassengers: (passengers: PassengerDraft[]) => void;
  setHold: (input: { bookingId: string; holdExpiresAt: string }) => void;
  setToast: (message?: string) => void;
  ensureIdempotencyKey: () => string;
  tickHold: () => void;
  reset: () => void;
};

const defaultTickets: TicketQuantity[] = [
  { ticketType: 'ADULT', quantity: 2 },
  { ticketType: 'CHILD', quantity: 0 },
  { ticketType: 'SENIOR', quantity: 0 },
];

export const useBookingStore = create<BookingState>((set, get) => ({
  step: 1,
  startDate: '',
  endDate: '',
  tickets: defaultTickets,
  schedules: [],
  selectedRooms: [],
  passengers: [],
  secondsRemaining: 0,
  setStep: (step) => set({ step }),
  setSearch: (input) => set({ ...input }),
  setSchedules: (schedules) => set({ schedules }),
  selectSchedule: (selectedSchedule) => set({ selectedSchedule, selectedRooms: [], step: 2 }),
  toggleRoom: (room) =>
    set((state) => {
      const exists = state.selectedRooms.some((selected) => selected.id === room.id);
      return {
        selectedRooms: exists
          ? state.selectedRooms.filter((selected) => selected.id !== room.id)
          : [...state.selectedRooms, room],
      };
    }),
  setPassengers: (passengers) => set({ passengers }),
  setHold: ({ bookingId, holdExpiresAt }) =>
    set({
      bookingId,
      holdExpiresAt,
      secondsRemaining: Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000)),
    }),
  setToast: (toast) => set({ toast }),
  ensureIdempotencyKey: () => {
    const existing = get().idempotencyKey;
    if (existing) return existing;
    const next = crypto.randomUUID();
    set({ idempotencyKey: next });
    return next;
  },
  tickHold: () =>
    set((state) => {
      if (!state.holdExpiresAt) return { secondsRemaining: 0 };
      const secondsRemaining = Math.max(0, Math.floor((new Date(state.holdExpiresAt).getTime() - Date.now()) / 1000));
      if (secondsRemaining === 0 && state.bookingId) {
        return {
          secondsRemaining,
          step: 1,
          bookingId: undefined,
          holdExpiresAt: undefined,
          selectedRooms: [],
          toast: 'Session expired. Please search again.',
        };
      }
      return { secondsRemaining };
    }),
  reset: () =>
    set({
      step: 1,
      startDate: '',
      endDate: '',
      departureTime: undefined,
      tickets: defaultTickets,
      schedules: [],
      selectedSchedule: undefined,
      selectedRooms: [],
      passengers: [],
      bookingId: undefined,
      holdExpiresAt: undefined,
      idempotencyKey: undefined,
      secondsRemaining: 0,
    }),
}));
