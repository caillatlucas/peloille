/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: '/bentosite',
  trailingSlash: true,
};

export default nextConfig;
