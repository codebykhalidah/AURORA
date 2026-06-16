/**
 * Builds a complete, copy-ready Aurora booking project inside the target folder.
 *
 * Usage (from portfolio root):
 *   node aurora-booking-standalone/scripts/bootstrap-from-portfolio.mjs
 *   node aurora-booking-standalone/scripts/bootstrap-from-portfolio.mjs "C:\path\to\aurora-booking-standalone"
 */

import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kitRoot = path.resolve(__dirname, '..');
const portfolioRoot = path.resolve(kitRoot, '..');

const targetRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : kitRoot;

const COPY_PATHS = [
  'components/booking',
  'store/bookingStore.ts',
  'lib/pricing.ts',
  'lib/validations.ts',
  'app/globals.css',
  'app/api/bookings/[id]/route.ts',
  'prisma/schema.prisma',
  'prisma/seed.ts',
  'prisma/seed.sql',
];

const OPTIONAL_MARKETING = 'demo-aurora-maritime.html';

async function copyFileOrDir(relativePath) {
  const source = path.join(portfolioRoot, relativePath);
  const destination = path.join(targetRoot, relativePath);
  if (!existsSync(source)) {
    console.warn(`  skip (missing): ${relativePath}`);
    return;
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
  console.log(`  copied: ${relativePath}`);
}

async function copyKitFile(relativePath) {
  const source = path.join(kitRoot, relativePath);
  const destination = path.join(targetRoot, relativePath);
  if (!existsSync(source)) return;
  if (path.resolve(source).toLowerCase() === path.resolve(destination).toLowerCase()) {
    console.log(`  kit (already in place): ${relativePath}`);
    return;
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
  console.log(`  kit → ${relativePath}`);
}

async function overlayTemplate(relativePath) {
  const source = path.join(kitRoot, 'templates', relativePath);
  const destination = path.join(targetRoot, relativePath);
  if (!existsSync(source)) return;
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
  console.log(`  template → ${relativePath}`);
}

async function patchMarketingHtml(filePath) {
  let html = await readFile(filePath, 'utf8');

  html = html.replace(/http:\/\/localhost:3000\/aurora-booking/g, '/');
  html = html.replace(/href="#" data-booking-link/g, 'href="/" data-booking-link');

  html = html.replace(
    /let cachedBookingHref;\s*\n\s*async function resolveBookingHref\(\) \{[\s\S]*?\n    \}/,
    `let cachedBookingHref = '/';\n\n    async function resolveBookingHref() {\n      return '/';\n    }`,
  );

  html = html.replace(
    /If the booking panel stays blank, run <code>npm run dev<\/code> in the project folder \(ports 3000 or 3001\), then click Reserve Voyage again\./,
    'If the booking panel stays blank, run <code>npm run dev</code> in this project folder, then click Reserve Voyage again.',
  );

  await writeFile(filePath, html, 'utf8');
  console.log('  patched: public/marketing.html (booking links → /)');
}

async function main() {
  console.log(`Portfolio root: ${portfolioRoot}`);
  console.log(`Target project: ${targetRoot}\n`);

  await mkdir(targetRoot, { recursive: true });

  console.log('Copying application source from portfolio…');
  for (const relativePath of COPY_PATHS) {
    await copyFileOrDir(relativePath);
  }

  console.log('\nCopying kit configuration…');
  const kitFiles = [
    'package.json',
    '.env.example',
    '.gitignore',
    'next.config.ts',
    'vercel.json',
    'tsconfig.json',
    'tailwind.config.js',
    'postcss.config.js',
    'README.md',
    'SETUP-GUIDE.md',
  ];
  for (const file of kitFiles) {
    await copyKitFile(file);
  }

  console.log('\nApplying production templates…');
  const templateFiles = [
    'lib/logger.ts',
    'lib/api.ts',
    'lib/prisma.ts',
    'app/page.tsx',
    'app/layout.tsx',
    'app/api/cruises/availability/route.ts',
    'app/api/bookings/hold/route.ts',
    'app/api/bookings/confirm/route.ts',
    'app/api/cron/cleanup-holds/route.ts',
  ];
  for (const file of templateFiles) {
    await overlayTemplate(file);
  }

  const marketingPath = path.join(targetRoot, 'public', 'marketing.html');
  if (existsSync(path.join(portfolioRoot, OPTIONAL_MARKETING))) {
    await mkdir(path.join(targetRoot, 'public'), { recursive: true });
    await cp(path.join(portfolioRoot, OPTIONAL_MARKETING), marketingPath);
    await patchMarketingHtml(marketingPath);
  }

  const envExample = path.join(targetRoot, '.env.example');
  const envPath = path.join(targetRoot, '.env');
  if (!existsSync(envPath) && existsSync(envExample)) {
    await cp(envExample, envPath);
    console.log('\nCreated .env from .env.example');
  }

  const templatesDir = path.join(targetRoot, 'templates');
  if (existsSync(templatesDir)) {
    await rm(templatesDir, { recursive: true, force: true });
    console.log('\nRemoved templates/ (already applied to project files).');
  }

  console.log('\nBootstrap complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
