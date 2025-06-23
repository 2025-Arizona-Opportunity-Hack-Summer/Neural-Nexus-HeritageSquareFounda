import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  redirects: async () => [
    {
      source: "/",
      destination: "/chat",
      permanent: true,
    },
  ],
};

export default nextConfig;
