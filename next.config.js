/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com', // Permitir imágenes desde GitHub
      },
    ],
  },
}

module.exports = nextConfig
