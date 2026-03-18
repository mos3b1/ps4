import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure environment variables are available at build time
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

export default nextConfig;
