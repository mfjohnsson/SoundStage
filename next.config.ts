import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Detta tillåter filer upp till 50MB
    },
  },
};

export default nextConfig;
