import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Small app (~36 pages): a couple of build workers instead of one per CPU
    // core, so builds don't run out of memory on laptops with other apps open.
    cpus: 2,
    staticGenerationMinPagesPerWorker: 25,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
