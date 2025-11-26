/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore ESLint errors during production build (test files cause issues)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig