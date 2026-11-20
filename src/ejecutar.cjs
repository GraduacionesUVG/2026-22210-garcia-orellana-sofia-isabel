const { existsSync } = require('node:fs');
const path = require('node:path');

const [command, mode, ...options] = process.argv.slice(2);
if (!['dev', 'start', 'build'].includes(command) || !['demo', 'conectado'].includes(mode)) {
  throw new Error('Usa uno de los comandos definidos en package.json.');
}

const config = path.join(__dirname, '.env.local');
if (existsSync(config)) process.loadEnvFile(config);
process.env.ANTROPOLOGIA_MODO = mode;
process.env.NEXT_PUBLIC_APP_URL ||= 'http://localhost:3000';
process.env.ANTROPOLOGIA_ORIGEN = process.env.NEXT_PUBLIC_APP_URL;
if (command === 'dev') process.env.WATCHPACK_POLLING ??= '1000';

const next = require.resolve('next/dist/bin/next');
const project = path.join(__dirname, 'frontend');
const args = [command, project];
if (command !== 'start') args.push('--webpack');
if (command !== 'build' && mode === 'demo') args.push('--hostname', '127.0.0.1');
process.argv = [process.execPath, next, ...args, ...options];
require(next);
