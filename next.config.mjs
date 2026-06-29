/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
  // Dev-only: allow CSS/JS when sharing local server via tunnel tools
  allowedDevOrigins: ["*.loca.lt", "127.0.0.1", "0.0.0.0"],
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
