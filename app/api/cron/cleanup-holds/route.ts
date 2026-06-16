import { NextRequest } from 'next/server';
import { BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { errorResponse, jsonResponse, optionsResponse } from '@/lib/api';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      logger.warn('cron.cleanup-holds.missing_secret');
      return jsonResponse(request, { error: 'Cron secret is not configured' }, 503);
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return jsonResponse(request, { error: 'Unauthorized' }, 401);
    }

    const result = await prisma.$transaction(async (tx) => {
      const expired = await tx.booking.findMany({
        where: {
          status: BookingStatus.PENDING_HOLD,
          hold_expires_at: { lt: new Date() },
        },
        select: { id: true },
      });
      const ids = expired.map((booking) => booking.id);
      if (ids.length === 0) return { count: 0 };

      await tx.roomLock.deleteMany({ where: { bookingId: { in: ids } } });
      return tx.booking.updateMany({
        where: { id: { in: ids } },
        data: { status: BookingStatus.EXPIRED },
      });
    });

    logger.info('cron.cleanup-holds.completed', { expired: result.count });
    return jsonResponse(request, { expired: result.count });
  } catch (error) {
    return errorResponse(request, error, 500, 'POST /api/cron/cleanup-holds');
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
