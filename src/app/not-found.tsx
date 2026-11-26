import Link from 'next/link';
import prisma from '@/lib/prisma';

export default async function NotFound() {
  const settingsDb = await prisma.setting.findMany();
  const settings = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);

  const title = settings.NOT_FOUND_TITLE || "Seite nicht gefunden";
  const text = settings.NOT_FOUND_TEXT || "Die gesuchte Seite konnte leider nicht gefunden werden. Möglicherweise wurde sie verschoben oder gelöscht.";
  const cta = settings.NOT_FOUND_CTA || "Zur Startseite";
  const bgImage = settings.NOT_FOUND_BG_IMAGE || '';
  const bgColor = settings.NOT_FOUND_BG_COLOR || '#000000';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main
        className="flex-grow flex items-center justify-center bg-cover bg-center relative"
        style={{
          backgroundImage: bgImage ? `url('${bgImage}')` : 'none',
          backgroundColor: bgImage ? 'transparent' : bgColor
        }}
      >
        {bgImage && <div className="absolute inset-0 bg-black/50 z-0"></div>}

        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <h1 className="text-9xl font-bold text-white mb-4 drop-shadow-lg">404</h1>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-md">
            {title}
          </h2>
          <p className="text-lg text-gray-200 mb-8 max-w-lg mx-auto drop-shadow">
            {text}
          </p>

          <Link
            href="/"
            className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg"
          >
            {cta}
          </Link>
        </div>
      </main>
    </div>
  );
}
