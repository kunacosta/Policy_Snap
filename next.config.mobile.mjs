/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',       // Static export for Capacitor/mobile
  images: {
    unoptimized: true,
  },
  trailingSlash: true,    // Required for static hosting on Android
};

export default nextConfig;
