import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["https://preview-chat-47104a97-44bf-454a-b9bb-512b601bdad3.space-z.ai", "*.space-z.ai"],
};

export default nextConfig;
