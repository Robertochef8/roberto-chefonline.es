import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Por defecto Next.js limita el body de una Server Action a 1MB, y una
      // foto de plato real (móvil/cámara) supera eso fácilmente.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
