import http from 'node:http';
import { realpath, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const SECURITY_HEADERS = {'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Permissions-Policy':'geolocation=(), camera=(), microphone=()','Cross-Origin-Resource-Policy':'same-origin'};
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const inside = (root, target) => { const relative = path.relative(root, target); return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative); };
export function createStaticServer(root = ROOT) {
  return http.createServer(async (req, res) => {
    const send = (code, body) => { res.writeHead(code, {'Content-Type':'text/plain; charset=utf-8',...SECURITY_HEADERS}); res.end(req.method === 'HEAD' ? undefined : body); };
    if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Allow','GET, HEAD'); return send(405,'Method not allowed'); }
    try {
      const pathname = decodeURIComponent(req.url.split('?')[0]);
      const parts = pathname.split('/');
      if (!pathname.startsWith('/') || parts.some(p => p === '..' || p.startsWith('.')) || /[\\:\x00-\x1f]/.test(pathname)) return send(404,'Not found');
      // Only public application assets are exposed, never source tooling or backups.
      const publicPath = pathname === '/' ? 'index.html' : pathname.slice(1);
      if (!(publicPath === 'index.html' || /^(js|css)\/.+\.(js|css)$/.test(publicPath))) return send(404,'Not found');
      const realRoot = await realpath(root);
      const target = await realpath(path.resolve(realRoot, publicPath));
      if (!inside(realRoot,target) || !(await stat(target)).isFile()) return send(404,'Not found');
      const body = await readFile(target);
      res.writeHead(200, {'Content-Type': MIME[path.extname(target)] || 'application/octet-stream','Content-Length':body.length,...SECURITY_HEADERS,'Cache-Control':'no-store'});
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) { send(error instanceof URIError ? 400 : ['ENOENT','ENOTDIR','EACCES'].includes(error.code) ? 404 : 500, 'Resource unavailable'); }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
  const server = createStaticServer();
  server.on('error', error => { console.error('Vison: ' + error.message); process.exitCode = 1; });
  server.listen(port,'127.0.0.1',()=>console.log('Vison: http://127.0.0.1:' + port));
}
