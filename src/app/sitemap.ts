import type { MetadataRoute } from "next";
import { getPrompts } from "@/lib/prompts";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...getPrompts().map((prompt) => ({
      url: `${siteConfig.url}/p/${prompt.slug}`,
      lastModified: new Date(prompt.createdAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
