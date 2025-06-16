import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose'],  // Enable hot reload for translation files
  webpack: (config, { dev }) => {
    if (dev) {
      // Watch translation files for hot reload
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
