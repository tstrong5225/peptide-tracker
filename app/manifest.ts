import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Peptide Tracker",
    short_name: "Peptide Tracker",
    description: "Vial Dosage Manager — track peptide reconstitution, dose history, and protocol adherence.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f1523",
    theme_color: "#0f1523",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
