import type { NextConfig } from "next";

// Allow self-signed certificates locally in dev mode
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const nextConfig: NextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: [
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
    "192.168.100.22",
    "192.168.100.22:3000"
  ],
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: (process.env.INTERNAL_BACKEND_URL || "http://localhost:5001") + "/api/:path*",
      },
    ];
  },
};

export default nextConfig;
