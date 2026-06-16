import { CruiseBookingWidget } from '@/components/booking/CruiseBookingWidget';

const bookingTheme = {
  primary: '#0a0a0a',
  panel: '#111111',
  text: '#ffffff',
  muted: 'rgba(255,255,255,0.6)',
  accent: '#c9a96e',
  accentSoft: 'rgba(201,169,110,0.1)',
  border: 'rgba(255,255,255,0.12)',
  fontFamily: 'Inter, sans-serif',
};

export default function BookingEmbedPage() {
  return (
    <main className="min-h-full overflow-y-auto bg-[#0a0a0a] px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-5xl">
        <CruiseBookingWidget apiBaseUrl="" theme={bookingTheme} />
      </div>
    </main>
  );
}
