import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sahabat Kreator",
    short_name: "SK",
    description: "Platform manajemen media sosial untuk kreator Indonesia",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    scope: "/",
    theme_color: "#D4A574",
    background_color: "#0F0F12",
    categories: ["productivity", "social"],
    icons: [
      {
        src: "/favicon/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
    prefer_related_applications: false,
  };
}
