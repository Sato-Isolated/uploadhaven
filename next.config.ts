import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose'],
  // Activer le hot reload pour les fichiers de traduction
  webpack: (config, { dev }) => {
    if (dev) {
      // Surveiller les fichiers de traduction pour le hot reload
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /node_modules/,
        aggregateTimeout: 300,
        poll: 1000,
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
