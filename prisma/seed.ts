import { PrismaClient, RoomType, TicketTypeName } from '@prisma/client';

const prisma = new PrismaClient();

const addDays = (days: number, hour = 14) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
};

async function main() {
  await prisma.bookingTicket.deleteMany();
  await prisma.passenger.deleteMany();
  await prisma.roomLock.deleteMany();
  await prisma.bookingRoom.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.room.deleteMany();
  await prisma.cruiseSchedule.deleteMany();
  await prisma.cruise.deleteMany();

  const cruise = await prisma.cruise.create({
    data: {
      name: 'Aurora Maritime: Monaco to Santorini',
      description: 'Seven-night boutique voyage for up to 50 guests aboard Aurora.',
      base_price: '2200.00',
      departure_port: 'Monaco',
      arrival_port: 'Santorini',
      schedules: {
        create: Array.from({ length: 6 }, (_, index) => {
          const departure = addDays(14 + index * 7);
          const arrival = addDays(21 + index * 7, 9);
          return {
            date: departure,
            departure_time: departure,
            arrival_time: arrival,
            is_active: true,
          };
        }),
      },
    },
  });

  const rooms = [
    ...Array.from({ length: 8 }, (_, i) => ({
      cruiseId: cruise.id,
      room_number: `I-${String(i + 1).padStart(2, '0')}`,
      room_type: RoomType.INTERIOR,
      price_multiplier: 1,
      capacity: 2,
      is_active: true,
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
      cruiseId: cruise.id,
      room_number: `O-${String(i + 1).padStart(2, '0')}`,
      room_type: RoomType.OCEAN_VIEW,
      price_multiplier: 1.35,
      capacity: 2,
      is_active: true,
    })),
    ...Array.from({ length: 7 }, (_, i) => ({
      cruiseId: cruise.id,
      room_number: `S-${String(i + 1).padStart(2, '0')}`,
      room_type: RoomType.SUITE,
      price_multiplier: 2.1,
      capacity: 4,
      is_active: true,
    })),
  ];

  await prisma.room.createMany({ data: rooms });

  await prisma.ticketType.createMany({
    data: [
      { name: TicketTypeName.ADULT, base_price: '750.00' },
      { name: TicketTypeName.CHILD, base_price: '420.00' },
      { name: TicketTypeName.SENIOR, base_price: '640.00' },
    ],
  });

  console.log('Seed complete: Aurora Maritime cruise, schedules, rooms, and tickets created.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
