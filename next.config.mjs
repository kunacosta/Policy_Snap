/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',        // Needed for Electron packaging
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
};

export default nextConfig;
