// TLS terminates only on loopback. Next.js remains on 127.0.0.1:3020.
const https = require('node:https'), http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const directory = path.resolve(__dirname, '../.local-https');
const host = 'generic-local.hplife-test.dyd.solutions';
const server = https.createServer({ pfx: fs.readFileSync(path.join(directory, 'localhost.pfx')), passphrase: fs.readFileSync(path.join(directory, 'passphrase'), 'utf8').trim(), minVersion: 'TLSv1.2' }, (req, res) => {
  if (req.headers.host !== host) { res.writeHead(400); res.end('Unknown local host.'); return; }
  const headers = { ...req.headers, 'x-forwarded-proto': 'https', 'x-forwarded-host': host };
  delete headers['proxy-authorization']; delete headers['proxy-connection'];
  const upstream = http.request({ hostname: '127.0.0.1', port: 3020, method: req.method, path: req.url, headers }, response => { res.writeHead(response.statusCode, response.headers); response.pipe(res); });
  upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('GenericLMS is not running. Start it on port 3020.'); });
  req.on('aborted', () => upstream.destroy());
  res.on('close', () => { if (!res.writableEnded) upstream.destroy(); });
  req.pipe(upstream);
});
server.requestTimeout = 120000;
server.listen(443, '127.0.0.1', () => console.log(`Local GenericLMS: https://${host}`));
