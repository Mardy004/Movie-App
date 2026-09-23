const http = require('http');
const target = process.env.MITM_TARGET || 'localhost:4000';
const listen = process.env.MITM_PORT || 5555;

const server = http.createServer((req, res) => {
  const headers = {};
  Object.keys(req.headers).forEach((k) => {
    if (k.toLowerCase() === 'host') return;
    headers[k] = req.headers[k];
  });

  const bodyChunks = [];
  req.on('data', (c) => bodyChunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(bodyChunks).toString('utf8');

    console.log('=== INCOMING REQUEST ===');
    console.log('method:', req.method);
    console.log('url:', req.url);
    console.log('authorization:', headers.authorization);
    console.log('content-type:', headers['content-type']);
    console.log('body:', body.slice(0, 800));
    console.log('==========================');

    const [host, port = '4000'] = target.split(':');
    const proxied = http.request({
      hostname: host,
      port: Number(port),
      path: req.url,
      method: req.method,
      headers: headers,
    }, (proxyRes) => {
      proxyRes.pipe(res);
    });

    proxied.on('error', (e) => {
      console.error('proxy error:', e.message);
      res.statusCode = 502;
      res.end(JSON.stringify({ success: false, error: { message: e.message } }));
    });

    if (body) proxied.write(body);
    proxied.end();
  });
});

server.listen(Number(listen), () => {
  console.log(`mitm listening on :${listen} -> ${target}`);
});
