/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The provider tree mounts on the client; nothing here renders on the server.
  // We expose the local workspace package via file:../.. — Next has no problem
  // resolving it through node_modules.
};

export default nextConfig;
