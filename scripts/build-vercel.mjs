import { mkdirSync, cpSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

console.log('Building Vercel output structure...');
console.log('Project root:', root);

// 1. Clean and create .vercel/output structure
const outDir = join(root, '.vercel', 'output');
const staticDir = join(outDir, 'static');
const funcDir = join(outDir, 'functions', 'api', 'index.func');

mkdirSync(staticDir, { recursive: true });
mkdirSync(funcDir, { recursive: true });

// 2. Copy Vite static build → .vercel/output/static/
const viteDist = join(root, 'artifacts', 'panini-mundial', 'dist', 'public');
if (!existsSync(viteDist)) {
  console.error('ERROR: Vite build not found at', viteDist);
  process.exit(1);
}
cpSync(viteDist, staticDir, { recursive: true });
console.log('✓ Static files copied to .vercel/output/static/');

// 3. Copy API handler files → .vercel/output/functions/api/index.func/
const apiVercelDist = join(root, 'artifacts', 'api-server', 'dist', 'vercel');
if (!existsSync(apiVercelDist)) {
  console.error('ERROR: API server build not found at', apiVercelDist);
  process.exit(1);
}
cpSync(apiVercelDist, funcDir, { recursive: true });
console.log('✓ API handler files copied');

// 4. Write the function entrypoint (handler.mjs is now in the same dir)
writeFileSync(join(funcDir, 'index.js'), `
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let _app = null;

async function getApp() {
  if (!_app) {
    const handlerPath = join(__dirname, 'handler.mjs');
    const { default: app } = await import(pathToFileURL(handlerPath).href);
    _app = app;
  }
  return _app;
}

export default async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}
`.trimStart());
console.log('✓ Function entrypoint written');

// 5. Write function config
writeFileSync(join(funcDir, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.js',
  launcherType: 'Nodejs',
  maxDuration: 30
}, null, 2));
console.log('✓ Function config written');

// 6. Write deployment config with routes
writeFileSync(join(outDir, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { src: '/api/(.*)', dest: '/api/index' },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' }
  ],
  crons: [
    { path: '/api/cron/update-tracking', schedule: '0 10 * * *' }
  ]
}, null, 2));
console.log('✓ Vercel config written');

console.log('\n✅ Vercel Build Output API v3 structure created successfully');
console.log('   .vercel/output/static/ → static site');
console.log('   .vercel/output/functions/api/index.func/ → serverless function');
