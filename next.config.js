/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'nabra-files.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'nabra-files.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'f005.backblazeb2.com',
      },
      {
        protocol: 'https',
        hostname: 's3.us-east-005.backblazeb2.com',
      },
      {
        protocol: 'https',
        hostname: 'Nabra-AI-System.s3.us-east-005.backblazeb2.com',
      },
    ],
  },
};

module.exports = nextConfig;
