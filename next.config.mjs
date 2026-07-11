/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  allowedDevOrigins: ["192.168.1.7"],
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
