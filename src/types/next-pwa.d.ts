declare module "next-pwa" {
  import type { NextConfig } from "next";

  type PwaOptions = {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    fallbacks?: {
      document?: string;
    };
  };

  export default function withPWAInit(options?: PwaOptions): (
    nextConfig: NextConfig,
  ) => NextConfig;
}
