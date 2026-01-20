import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_FORMNOW_API_KEY: process.env.NEXT_PUBLIC_FORMNOW_API_KEY,
  },
};

export default nextConfig;
