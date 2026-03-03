// Allow self-signed certificates (local dev / corporate proxy)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
