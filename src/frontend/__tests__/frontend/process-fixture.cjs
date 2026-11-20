const { spawn } = require('node:child_process');
const net = require('node:net');
if (process.argv[2] === 'descendant') {
  const server = net.createServer();
  server.listen(0, '127.0.0.1', () => console.log(JSON.stringify({ type: 'descendant-ready', pid: process.pid, port: server.address().port })));
  process.on('SIGTERM', () => { if (process.argv[3] === 'graceful') server.close(() => process.exit(0)); });
  // Last-resort bounded safety, independent of the lifecycle code under test.
  setTimeout(() => process.exit(1), 10_000).unref();
} else {
  spawn(process.execPath, [__filename, 'descendant', process.argv[2]], { stdio: ['ignore','inherit','inherit'] });
  process.on('SIGTERM', () => process.exit(0));
  setInterval(() => {}, 1000);
}
