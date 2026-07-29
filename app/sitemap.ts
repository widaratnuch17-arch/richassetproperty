import type { MetadataRoute } from "next";
import { propertyDetails } from "./data/properties";

const SITE_URL = "https://rich-asset-property.widaratnuch17.chatgpt.site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const propertyPages: MetadataRoute.Sitemap = propertyDetails.map((property) => ({
    url: `${SITE_URL}/properties/${property.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...propertyPages];
}
