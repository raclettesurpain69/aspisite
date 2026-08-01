import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Twilio webhooks post large XML/form payloads; keep API routes on the
  // Node.js runtime (not edge) so the twilio SDK's crypto-based signature
  // validation works.
  serverExternalPackages: ["twilio"],
};

export default nextConfig;
