/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'nabra-files.s3.amazonaws.com',
      'nabra-files.s3.us-east-1.amazonaws.com',
    ],
  },
};

module.exports = nextConfig;
