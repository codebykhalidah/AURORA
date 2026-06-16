import type { Cruise, Room, TicketType, TicketTypeName } from '@prisma/client';
import type { TicketQuantityInput } from './validations';

export const TAX_RATE = 0.1;

export type PriceBreakdown = {
  roomSubtotal: number;
  ticketSubtotal: number;
  taxesAndFees: number;
  total: number;
  nights: number;
};

const money = (value: unknown): number => Number(value ?? 0);

export function calculateNights(departure: Date, arrival: Date): number {
  const ms = arrival.getTime() - departure.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function calculateBookingPrice(params: {
  cruise: Cruise;
  rooms: Room[];
  ticketTypes: TicketType[];
  tickets: TicketQuantityInput[];
  departure: Date;
  arrival: Date;
}): PriceBreakdown {
  const nights = calculateNights(params.departure, params.arrival);
  const basePrice = money(params.cruise.base_price);
  const roomSubtotal = params.rooms.reduce(
    (sum, room) => sum + basePrice * room.price_multiplier * nights,
    0,
  );

  const ticketTypeByName = new Map<TicketTypeName, TicketType>(
    params.ticketTypes.map((ticketType) => [ticketType.name, ticketType]),
  );

  const ticketSubtotal = params.tickets.reduce((sum, ticket) => {
    const ticketType = ticketTypeByName.get(ticket.ticketType as TicketTypeName);
    return sum + money(ticketType?.base_price) * ticket.quantity;
  }, 0);

  const taxesAndFees = (roomSubtotal + ticketSubtotal) * TAX_RATE;
  const total = roomSubtotal + ticketSubtotal + taxesAndFees;

  return {
    roomSubtotal: roundMoney(roomSubtotal),
    ticketSubtotal: roundMoney(ticketSubtotal),
    taxesAndFees: roundMoney(taxesAndFees),
    total: roundMoney(total),
    nights,
  };
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
