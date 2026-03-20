
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* 启用静态导出，这是打包桌面应用的前提 */
  output: 'export',
  /* 确保生成的静态文件路径在 Electron 中更易处理 */
  trailingSlash: true,
  images: {
    unoptimized: true, // 静态导出模式下必须禁用图片优化，确保护理端离线加载速度
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
    ignoreBuildErrors: true, // 生产环境忽略类型错误以加快构建速度
  },
  eslint: {
    ignoreDuringBuilds: true, // 生产环境忽略 ESLint 检查
  }
};

export default nextConfig;
