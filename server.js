process.env.NODE_ENV ||= 'production';

const { createServer } = require('node:http');
const next = require('next');

const port = Number(process.env.PORT || process.env.PLESK_NODEJS_PORT || 3000);
const hostname = process.env.HOSTNAME || '127.0.0.1';
const app = next({ dev: process.env.NODE_ENV !== 'production', hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((request, response) => {
    handle(request, response);
  }).listen(port, hostname, () => {
    console.log(`Akron Tire Shop POS running on http://${hostname}:${port}`);
  });
});
