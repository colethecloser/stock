/** @type {import('next').NextConfig} */
const nextConfig = {
  // keep the Postgres driver out of the bundle; it runs as a Node external
  experimental: {
    serverComponentsExternalPackages: ["pg"],
  },
};
export default nextConfig;
