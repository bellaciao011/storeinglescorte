let _app = null;

async function getApp() {
  if (!_app) {
    const mod = await import('../artifacts/api-server/dist/vercel/handler.mjs');
    _app = mod.default;
  }
  return _app;
}

export default async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}
