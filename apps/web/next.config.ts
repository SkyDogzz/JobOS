import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@jobos/contracts", "@jobos/validation", "@jobos/ui"]
};

export default nextConfig;

