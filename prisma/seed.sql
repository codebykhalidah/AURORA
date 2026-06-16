BEGIN;

-- Clear existing seed/demo data in dependency order.
DELETE FROM "BookingTicket";
DELETE FROM "Passenger";
DELETE FROM "RoomLock";
DELETE FROM "BookingRoom";
DELETE FROM "Booking";
DELETE FROM "TicketType";
DELETE FROM "Room";
DELETE FROM "CruiseSchedule";
DELETE FROM "Cruise";

-- Cruise
INSERT INTO "Cruise" (
  "id",
  "name",
  "description",
  "base_price",
  "departure_port",
  "arrival_port",
  "created_at",
  "updated_at"
) VALUES (
  'cruise_aurora_monaco_santorini',
  'Aurora Maritime: Monaco to Santorini',
  'Seven-night boutique voyage for up to 50 guests aboard Aurora.',
  2200.00,
  'Monaco',
  'Santorini',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Six weekly schedules, matching seed.ts addDays(14 + index * 7, 14) and arrival seven days later at 09:00.
INSERT INTO "CruiseSchedule" (
  "id",
  "cruiseId",
  "departure_time",
  "arrival_time",
  "date",
  "is_active"
) VALUES
  (
    'schedule_aurora_01',
    'cruise_aurora_monaco_santorini',
    (CURRENT_DATE + INTERVAL '14 days' + TIME '14:00'),
    (CURRENT_DATE + INTERVAL '21 days' + TIME '09:00'),
    (CURRENT_DATE + INTERVAL '14 days' + TIME '14:00'),
    true
  ),
  (
    'schedule_aurora_02',
    'cruise_aurora_monaco_santorini',
    (CURRENT_DATE + INTERVAL '21 days' + TIME '14:00'),
    (CURRENT_DATE + INTERVAL '28 days' + TIME '09:00'),
    (CURRENT_DATE + INTERVAL '21 days' + TIME '14:00'),
    true
  ),
  (
    'schedule_aurora_03',
    'cruise_aurora_monaco_santorini',
    (CURRENT_DATE + INTERVAL '28 days' + TIME '14:00'),
    (CURRENT_DATE + INTERVAL '35 days' + TIME '09:00'),
    (CURRENT_DATE + INTERVAL '28 days' + TIME '14:00'),
    true
  ),
  (
    'schedule_aurora_04',
    'cruise_aurora_monaco_santorini',
    (CURRENT_DATE + INTERVAL '35 days' + TIME '14:00'),
    (CURRENT_DATE + INTERVAL '42 days' + TIME '09:00'),
    (CURRENT_DATE + INTERVAL '35 days' + TIME '14:00'),
    true
  ),
  (
    'schedule_aurora_05',
    'cruise_aurora_monaco_santorini',
    (CURRENT_DATE + INTERVAL '42 days' + TIME '14:00'),
    (CURRENT_DATE + INTERVAL '49 days' + TIME '09:00'),
    (CURRENT_DATE + INTERVAL '42 days' + TIME '14:00'),
    true
  ),
  (
    'schedule_aurora_06',
    'cruise_aurora_monaco_santorini',
    (CURRENT_DATE + INTERVAL '49 days' + TIME '14:00'),
    (CURRENT_DATE + INTERVAL '56 days' + TIME '09:00'),
    (CURRENT_DATE + INTERVAL '49 days' + TIME '14:00'),
    true
  );

-- Rooms: 8 interior, 10 ocean view, 7 suites.
INSERT INTO "Room" (
  "id",
  "cruiseId",
  "room_number",
  "room_type",
  "price_multiplier",
  "capacity",
  "is_active"
) VALUES
  ('room_i_01', 'cruise_aurora_monaco_santorini', 'I-01', 'INTERIOR'::"RoomType", 1.00, 2, true),
  ('room_i_02', 'cruise_aurora_monaco_santorini', 'I-02', 'INTERIOR'::"RoomType", 1.00, 2, true),
  ('room_i_03', 'cruise_aurora_monaco_santorini', 'I-03', 'INTERIOR'::"RoomType", 1.00, 2, true),
  ('room_i_04', 'cruise_aurora_monaco_santorini', 'I-04', 'INTERIOR'::"RoomType", 1.00, 2, true),
  ('room_i_05', 'cruise_aurora_monaco_santorini', 'I-05', 'INTERIOR'::"RoomType", 1.00, 2, true),
  ('room_i_06', 'cruise_aurora_monaco_santorini', 'I-06', 'INTERIOR'::"RoomType", 1.00, 2, true),
  ('room_i_07', 'cruise_aurora_monaco_santorini', 'I-07', 'INTERIOR'::"RoomType", 1.00, 2, true),
  ('room_i_08', 'cruise_aurora_monaco_santorini', 'I-08', 'INTERIOR'::"RoomType", 1.00, 2, true),
  ('room_o_01', 'cruise_aurora_monaco_santorini', 'O-01', 'OCEAN_VIEW'::"RoomType", 1.35, 2, true),
  ('room_o_02', 'cruise_aurora_monaco_santorini', 'O-02', 'OCEAN_VIEW'::"RoomType", 1.35, 2, true),
  ('room_o_03', 'cruise_aurora_monaco_santorini', 'O-03', 'OCEAN_VIEW'::"RoomType", 1.35, 2, true),
  ('room_o_04', 'cruise_aurora_monaco_santorini', 'O-04', 'OCEAN_VIEW'::"RoomType", 1.35, 2, true),
  ('room_o_05', 'cruise_aurora_monaco_santorini', 'O-05', 'OCEAN_VIEW'::"RoomType", 1.35, 2, true),
  ('room_o_06', 'cruise_aurora_monaco_santorini', 'O-06', 'OCEAN_VIEW'::"RoomType", 1.35, 2, true),
  ('room_o_07', 'cruise_aurora_monaco_santorini', 'O-07', 'OCEAN_VIEW'::"RoomType", 1.35, 2, true),
  ('room_o_08', 'cruise_aurora_monaco_santorini', 'O-08', 'OCEAN_VIEW'::"RoomType", 1.35, 2, true),
  ('room_o_09', 'cruise_aurora_monaco_santorini', 'O-09', 'OCEAN_VIEW'::"RoomType", 1.35, 2, true),
  ('room_o_10', 'cruise_aurora_monaco_santorini', 'O-10', 'OCEAN_VIEW'::"RoomType", 1.35, 2, true),
  ('room_s_01', 'cruise_aurora_monaco_santorini', 'S-01', 'SUITE'::"RoomType", 2.10, 4, true),
  ('room_s_02', 'cruise_aurora_monaco_santorini', 'S-02', 'SUITE'::"RoomType", 2.10, 4, true),
  ('room_s_03', 'cruise_aurora_monaco_santorini', 'S-03', 'SUITE'::"RoomType", 2.10, 4, true),
  ('room_s_04', 'cruise_aurora_monaco_santorini', 'S-04', 'SUITE'::"RoomType", 2.10, 4, true),
  ('room_s_05', 'cruise_aurora_monaco_santorini', 'S-05', 'SUITE'::"RoomType", 2.10, 4, true),
  ('room_s_06', 'cruise_aurora_monaco_santorini', 'S-06', 'SUITE'::"RoomType", 2.10, 4, true),
  ('room_s_07', 'cruise_aurora_monaco_santorini', 'S-07', 'SUITE'::"RoomType", 2.10, 4, true);

-- Ticket types
INSERT INTO "TicketType" (
  "id",
  "name",
  "base_price"
) VALUES
  ('ticket_adult', 'ADULT'::"TicketTypeName", 750.00),
  ('ticket_child', 'CHILD'::"TicketTypeName", 420.00),
  ('ticket_senior', 'SENIOR'::"TicketTypeName", 640.00);

COMMIT;
