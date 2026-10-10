const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

function fwd(prefix) {
  return function(req, res) {
    var upPath = prefix + req.url;
    var hdrs = Object.assign({}, req.headers);
    hdrs['host'] = 'june.hidencloud.com:24709';
    delete hdrs['accept-encoding'];
    var opts = { hostname: 'june.hidencloud.com', port: 24709, path: upPath, method: req.method, headers: hdrs };
    var pr = http.request(opts, function(ur) {
      res.writeHead(ur.statusCode, ur.headers);
      ur.pipe(res);
    });
    pr.on('error', function(e) { console.error('proxy err', e.message); if (!res.headersSent) { res.statusCode = 502; res.end('error'); } });
    req.pipe(pr);
  };
}

app.get('/ping', function(req, res) { res.json({ ok: true, port: PORT }); });
app.use('/api', fwd('/api'));
app.use('/listen', fwd('/listen'));
app.use('/key', fwd('/key'));
app.get('/', function(req, res) { res.sendFile(path.join(__dirname, 'index.html')); });
process.on('uncaughtException', function(e) { console.error('CRASH', e); });
app.listen(PORT, function() { console.log('READY on port ' + PORT); });
