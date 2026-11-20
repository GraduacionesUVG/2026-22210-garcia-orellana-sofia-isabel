const net = require('node:net');
async function assertPortAvailable(port, host = '127.0.0.1') {
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', error => reject(new Error(`Dedicated frontend port unavailable; foreign server must not be reused: ${error.code}`)));
    probe.listen(port, host, () => probe.close(error => error ? reject(error) : resolve()));
  });
}
module.exports = { assertPortAvailable };
