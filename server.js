const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = 'june.hidencloud.com';
const HPORT = 24709;

function proxy(prefix) {
  return (req, res) => {
    const upPath = prefix + req.url;
    const hdrs = Object.assign({}, req.headers);
    hdrs['host'] = HOST + ':' + HPORT;
    delete hdrs['accept-encoding'];
    console.log('[proxy]', req.method, upPath);
    const pr = http.request({ hostname: HOST, port: HPORT, path: upPath, method: req.method, headers: hdrs }, ur => {
      res.writeHead(ur.statusCode, ur.headers);
      ur.pipe(res);
    });
    pr.on('error', e => { console.error('[err]', upPath, e.message); if (!res.headersSent) res.status(502).end('error'); });
    req.pipe(pr);
  };
}

app.get('/ping', (req, res) => res.json({ ok: true, port: PORT }));
app.use('/api',    proxy('/api'));
app.use('/listen', proxy('/listen'));
app.use('/key',    proxy('/key'));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
process.on('uncaughtException', e => console.error('[crash]', e.message));
app.listen(PORT, () => console.log('[ready] port=' + PORT));
