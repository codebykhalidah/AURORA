import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiError, errorResponse, jsonResponse, optionsResponse } from '@/lib/api';
import { bookingIdSchema } from '@/lib/validations';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = bookingIdSchema.parse(await context.params);
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        schedule: { include: { cruise: true } },
        rooms: { include: { room: true } },
        tickets: { include: { ticketType: true } },
        passengers: true,
      },
    });

    if (!booking) throw new ApiError(404, 'Booking not found');
    return jsonResponse(request, { booking });
  } catch (error) {
    return errorResponse(request, error);
  }
}
