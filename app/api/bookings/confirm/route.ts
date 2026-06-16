import { NextRequest } from 'next/server';
import { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError, errorResponse, jsonResponse, optionsResponse } from '@/lib/api';
import { confirmBookingSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: NextRequest) {
  try {
    const input = confirmBookingSchema.parse(await request.json());

    const result = await prisma.$transaction(
      async (tx) => {
        const existingByIdempotencyKey = await tx.booking.findUnique({
          where: { idempotency_key: input.idempotency_key },
          include: {
            rooms: { include: { room: true } },
            tickets: { include: { ticketType: true } },
            passengers: true,
            schedule: { include: { cruise: true } },
          },
        });

        if (existingByIdempotencyKey) {
          return { booking: existingByIdempotencyKey, idempotentReplay: true };
        }

        const booking = await tx.booking.findUnique({
          where: { id: input.bookingId },
          include: {
            rooms: true,
            tickets: true,
            schedule: { include: { cruise: true } },
          },
        });

        if (!booking) throw new ApiError(404, 'Booking hold not found');
        if (booking.status === BookingStatus.CONFIRMED) throw new ApiError(409, 'Booking is already confirmed');
        if (booking.status !== BookingStatus.PENDING_HOLD) throw new ApiError(409, 'Booking hold is no longer active');
        if (!booking.hold_expires_at || booking.hold_expires_at <= new Date()) {
          await tx.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.EXPIRED },
          });
          throw new ApiError(409, 'Booking hold has expired');
        }

        const roomIds = booking.rooms.map((room) => room.roomId);
        const conflicts = await tx.roomLock.findMany({
          where: {
            scheduleId: booking.scheduleId,
            roomId: { in: roomIds },
            bookingId: { not: booking.id },
            OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
            booking: { status: { in: [BookingStatus.PENDING_HOLD, BookingStatus.CONFIRMED] } },
          },
          select: { roomId: true },
        });

        if (conflicts.length > 0) {
          throw new ApiError(409, 'One or more selected rooms were booked by another guest');
        }

        await tx.roomLock.updateMany({
          where: { bookingId: booking.id },
          data: { expires_at: null },
        });

        const confirmed = await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CONFIRMED,
            idempotency_key: input.idempotency_key,
            hold_expires_at: null,
            passengers: {
              create: input.passengers.map((passenger) => ({
                roomId: passenger.roomId,
                first_name: passenger.first_name,
                last_name: passenger.last_name,
                date_of_birth: passenger.date_of_birth,
                ticket_type: passenger.ticket_type,
              })),
            },
          },
          include: {
            rooms: { include: { room: true } },
            tickets: { include: { ticketType: true } },
            passengers: true,
            schedule: { include: { cruise: true } },
          },
        });

        return { booking: confirmed, idempotentReplay: false };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      },
    );

    logger.info('booking.confirmed', {
      bookingId: result.booking.id,
      idempotentReplay: result.idempotentReplay,
    });

    return jsonResponse(request, result);
  } catch (error) {
    return errorResponse(request, error, 500, 'POST /api/bookings/confirm');
  }
}
