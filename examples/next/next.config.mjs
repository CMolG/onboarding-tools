import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const nextRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(nextRoot, '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: workspaceRoot,
  },
  // The provider tree mounts on the client; nothing here renders on the server.
  // We expose the local workspace package via file:../.. — Next has no problem
  // resolving it through node_modules.
};

export default nextConfig;
