import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // The Docker image runs the self-contained server; `npm start` and Vercel use the default output.
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
  async rewrites() {
    // On Vercel, vercel.json already sends /api/* to the FastAPI service.
    if (process.env.VERCEL && !process.env.API_URL) return [];
    // The browser only ever talks to the Next.js origin. Proxying /api/* to
    // FastAPI keeps the auth cookie first-party and avoids CORS in production.
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
