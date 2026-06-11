import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let _app = null;

async function getApp() {
  if (!_app) {
    const handlerPath = join(__dirname, '..', 'artifacts', 'api-server', 'dist', 'vercel', 'handler.mjs');
    const { default: app } = await import(pathToFileURL(handlerPath).href);
    _app = app;
  }
  return _app;
}

export default async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}
