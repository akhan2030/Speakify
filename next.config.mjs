/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
  // Allow CSS/JS through Cloudflare tunnel & loca.lt when sharing dev server with clients
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.loca.lt",
    "127.0.0.1",
    "0.0.0.0",
  ],
  async redirects() {
    return [
      {
        source: "/register/ielts",
        destination: "/register/ielts-accelerator",
        permanent: false,
      },
      {
        source: "/register/toefl",
        destination: "/register/toefl-prep",
        permanent: false,
      },
      {
        source: "/courses/toefl",
        destination: "/courses/toefl-accelerator",
        permanent: false,
      },
      {
        source: "/courses/step",
        destination: "/courses/step-preparation",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
