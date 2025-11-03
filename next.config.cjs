/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  webpack: (config, { isServer }) => {
    // Exclude functions directory from build
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'firebase-functions': 'commonjs firebase-functions'
      });
    }
    return config;
  },
};

module.exports = nextConfig;