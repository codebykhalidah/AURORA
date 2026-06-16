import { z } from 'zod';

export const ticketTypeNameSchema = z.enum(['ADULT', 'CHILD', 'SENIOR']);

export const ticketQuantitySchema = z.object({
  ticketType: ticketTypeNameSchema,
  quantity: z.coerce.number().int().min(0).max(100),
});

export const availabilityQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  departureTime: z.string().optional(),
  rooms: z.coerce.number().int().min(1).max(25),
  tickets: z.preprocess((value) => {
    if (typeof value === 'string') return JSON.parse(value) as unknown;
    if (typeof value === 'undefined') return [];
    return value;
  }, z.array(ticketQuantitySchema)),
});

export const holdBookingSchema = z.object({
  scheduleId: z.string().min(1),
  roomIds: z.array(z.string().min(1)).min(1).max(25),
  tickets: z.array(ticketQuantitySchema).min(1),
  userId: z.string().min(1).optional(),
});

export const passengerSchema = z.object({
  roomId: z.string().min(1).optional(),
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  date_of_birth: z.coerce.date(),
  ticket_type: ticketTypeNameSchema,
});

export const confirmBookingSchema = z.object({
  bookingId: z.string().min(1),
  idempotency_key: z.string().uuid(),
  passengers: z.array(passengerSchema).min(1).max(100),
});

export const bookingIdSchema = z.object({
  id: z.string().min(1),
});

export type TicketQuantityInput = z.infer<typeof ticketQuantitySchema>;
export type HoldBookingInput = z.infer<typeof holdBookingSchema>;
export type ConfirmBookingInput = z.infer<typeof confirmBookingSchema>;
