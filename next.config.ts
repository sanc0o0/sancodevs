import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },

  images: {
    remotePatterns: [
      // Google avatars
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },

      // GitHub avatars
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },

      // Discord avatars & banners
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },

      // Twitter / X profile images
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },

      // LinkedIn profile media
      {
        protocol: "https",
        hostname: "media.licdn.com",
      },

      // Generic CDN providers
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },

      // Vercel blob / uploads
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },

      // Supabase storage
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },

      // AWS S3
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },

      // Firebase storage
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },

      // Cloudflare Images
      {
        protocol: "https",
        hostname: "imagedelivery.net",
      },
    ],
  },
};

export default nextConfig;