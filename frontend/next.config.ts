import type { NextConfig } from "next";

// Allow self-signed certificates locally in dev mode
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const nextConfig: NextConfig = {
  reactStrictMode: false,
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
