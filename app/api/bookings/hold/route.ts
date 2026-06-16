import { NextRequest } from 'next/server';
import { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError, errorResponse, jsonResponse, optionsResponse } from '@/lib/api';
import { calculateBookingPrice } from '@/lib/pricing';
import { holdBookingSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: NextRequest) {
  try {
    const input = holdBookingSchema.parse(await request.json());
    const now = new Date();
    const holdExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    const booking = await prisma.$transaction(async (tx) => {
      const schedule = await tx.cruiseSchedule.findUnique({
        where: { id: input.scheduleId },
        include: { cruise: true },
      });
      if (!schedule || !schedule.is_active) {
        throw new ApiError(404, 'Cruise schedule not found');
      }

      const rooms = await tx.room.findMany({
        where: {
          id: { in: input.roomIds },
          cruiseId: schedule.cruiseId,
          is_active: true,
        },
      });
      if (rooms.length !== input.roomIds.length) {
        throw new ApiError(400, 'One or more selected rooms are unavailable');
      }

      const conflictingRooms = await tx.roomLock.findMany({
        where: {
          scheduleId: schedule.id,
          roomId: { in: input.roomIds },
          OR: [{ expires_at: null }, { expires_at: { gt: now } }],
          booking: { status: { in: [BookingStatus.PENDING_HOLD, BookingStatus.CONFIRMED] } },
        },
        select: { roomId: true },
      });

      if (conflictingRooms.length > 0) {
        throw new ApiError(409, 'One or more selected rooms are already held or booked');
      }

      const ticketTypes = await tx.ticketType.findMany();
      const price = calculateBookingPrice({
        cruise: schedule.cruise,
        rooms,
        ticketTypes,
        tickets: input.tickets,
        departure: schedule.departure_time,
        arrival: schedule.arrival_time,
      });

      const created = await tx.booking.create({
        data: {
          userId: input.userId,
          scheduleId: schedule.id,
          status: BookingStatus.PENDING_HOLD,
          total_amount: new Prisma.Decimal(price.total),
          hold_expires_at: holdExpiresAt,
          rooms: {
            create: rooms.map((room) => ({
              roomId: room.id,
              scheduleId: schedule.id,
              price_at_booking: new Prisma.Decimal(Number(schedule.cruise.base_price) * room.price_multiplier * price.nights),
            })),
          },
          roomLocks: {
            create: rooms.map((room) => ({
              roomId: room.id,
              scheduleId: schedule.id,
              expires_at: holdExpiresAt,
            })),
          },
          tickets: {
            create: input.tickets
              .filter((ticket) => ticket.quantity > 0)
              .map((ticket) => {
                const ticketType = ticketTypes.find((candidate) => candidate.name === ticket.ticketType);
                if (!ticketType) throw new ApiError(400, `Ticket type ${ticket.ticketType} not found`);
                return {
                  ticketTypeId: ticketType.id,
                  quantity: ticket.quantity,
                  price_at_booking: ticketType.base_price,
                };
              }),
          },
        },
        include: {
          rooms: { include: { room: true } },
          tickets: { include: { ticketType: true } },
        },
      });

      return { created, price };
    });

    logger.info('booking.hold.created', { bookingId: booking.created.id, scheduleId: input.scheduleId });

    return jsonResponse(request, {
      bookingId: booking.created.id,
      hold_expires_at: booking.created.hold_expires_at,
      estimatedPrice: booking.price,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return jsonResponse(request, { error: 'One or more selected rooms were just held by another guest' }, 409);
    }
    return errorResponse(request, error, 500, 'POST /api/bookings/hold');
  }
}
