/** @type {import('next').NextConfig} */
const nextConfig = {webpack(config, { nextRuntime }) {
    if (nextRuntime === "nodejs") {
      config.resolve.alias.canvas = false;
    }

    return config;
  }};

export default nextConfig;
