import { NextRequest } from 'next/server';
import { BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { calculateBookingPrice } from '@/lib/pricing';
import { errorResponse, jsonResponse, optionsResponse } from '@/lib/api';
import { availabilityQuerySchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const input = availabilityQuerySchema.parse(params);
    const now = new Date();

    const schedules = await prisma.cruiseSchedule.findMany({
      where: {
        is_active: true,
        date: { gte: input.startDate, lte: input.endDate },
        ...(input.departureTime ? { departure_time: { gte: new Date(input.departureTime) } } : {}),
      },
      include: { cruise: true },
      orderBy: { departure_time: 'asc' },
    });

    const ticketTypes = await prisma.ticketType.findMany();

    const results = await Promise.all(
      schedules.map(async (schedule) => {
        const blockedRooms = await prisma.roomLock.findMany({
          where: {
            scheduleId: schedule.id,
            OR: [{ expires_at: null }, { expires_at: { gt: now } }],
            booking: { status: { in: [BookingStatus.PENDING_HOLD, BookingStatus.CONFIRMED] } },
          },
          select: { roomId: true },
        });

        const blockedRoomIds = new Set(blockedRooms.map((room) => room.roomId));
        const rooms = await prisma.room.findMany({
          where: {
            cruiseId: schedule.cruiseId,
            is_active: true,
            id: { notIn: [...blockedRoomIds] },
          },
          orderBy: [{ room_type: 'asc' }, { room_number: 'asc' }],
        });

        const candidateRooms = rooms.slice(0, input.rooms);
        const price = calculateBookingPrice({
          cruise: schedule.cruise,
          rooms: candidateRooms,
          ticketTypes,
          tickets: input.tickets,
          departure: schedule.departure_time,
          arrival: schedule.arrival_time,
        });

        return {
          schedule,
          availableRooms: rooms,
          canSatisfyRequest: rooms.length >= input.rooms,
          estimatedPrice: price,
        };
      }),
    );

    logger.info('availability.search', {
      startDate: input.startDate.toISOString(),
      endDate: input.endDate.toISOString(),
      resultCount: results.length,
    });

    return jsonResponse(request, { schedules: results.filter((result) => result.canSatisfyRequest) });
  } catch (error) {
    return errorResponse(request, error, 500, 'GET /api/cruises/availability');
  }
}
