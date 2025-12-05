/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'nabra-files.s3.amazonaws.com',
      'nabra-files.s3.us-east-1.amazonaws.com',
      'f005.backblazeb2.com',
      's3.us-east-005.backblazeb2.com',
      'Nabra-AI-System.s3.us-east-005.backblazeb2.com',
    ],
  },
};

module.exports = nextConfig;
