import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* 启用静态导出，这是打包桌面应用的前提 */
  output: 'export',
  images: {
    unoptimized: true, // 静态导出模式下必须禁用图片优化
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
