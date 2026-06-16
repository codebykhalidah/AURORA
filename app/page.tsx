import { CruiseBookingWidget } from '@/components/booking/CruiseBookingWidget';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-12 md:px-10">
      <div className="mx-auto max-w-5xl">
        <CruiseBookingWidget
          apiBaseUrl=""
          theme={{
            primary: '#0a0a0a',
            panel: '#111111',
            text: '#ffffff',
            muted: 'rgba(255,255,255,0.6)',
            accent: '#c9a96e',
            accentSoft: 'rgba(201,169,110,0.1)',
            border: 'rgba(255,255,255,0.12)',
            fontFamily: 'Inter, sans-serif',
          }}
        />
      </div>
    </main>
  );
}
