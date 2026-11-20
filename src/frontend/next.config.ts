import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..');
const nextConfig = {
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
