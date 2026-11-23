import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  agentRules: false,
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    }];
  },
};

export default config;
