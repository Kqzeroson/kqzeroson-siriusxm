const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const UPSTREAM_HOST = 'june.hidencloud.com';
const UPSTREAM_PORT = 24709;

console.log('[startup] PORT='+PORT+', UPSTREAM='+UPSTREAM_HOST+':'+UPSTREAM_PORT);

function proxyRequest(prefix) {
  return (req, res) => {
    const upstreamPath = prefix + req.url;
    console.log('[proxy]', req.method, upstreamPath);
    const headers = Object.assign({}, req.headers);
    headers['host'] = UPSTREAM_HOST + ':' + UPSTREAM_PORT;
    delete headers['accept-encoding'];
    const opts = { hostname: UPSTREAM_HOST, port: UPSTREAM_PORT, path: upstreamPath, method: req.method, headers };
    const proxy = http.request(opts, upstreamRes => {
      res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
      upstreamRes.pipe(res);
    });
    proxy.on('error', err => {
      console.error('[error]', upstreamPath, err.message);
      if (!res.headersSent) res.status(502).end('upstream error');
    });
    req.pipe(proxy);
  };
}

app.get('/ping', (req, res) => res.json({ status: 'ok', version: 2, port: PORT }));
app.use('/api',    proxyRequest('/api'));
app.use('/listen', proxyRequest('/listen'));
app.use('/key',    proxyRequest('/key'));
app.use('/stream', proxyRequest('/stream'));
app.use('/static', proxyRequest('/static'));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
process.on('uncaughtException', e => console.error('[crash]', e.message));
app.listen(PORT, () => console.log('[ready] http://localhost:'+PORT));
