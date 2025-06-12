import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose'],
  experimental: {
    webpackBuildWorker: true,
  },
  // Bundle analyzer configuration
  webpack: (config, { isServer }) => {
    // Bundle analysis
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: true,
          reportFilename: isServer
            ? '../analyze/server.html'
            : '../analyze/client.html',
        })
      );
    }

    return config;
  },
};

export default nextConfig;
