import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PromptActions } from "@/components/prompt-actions";
import { WatermarkedImage } from "@/components/watermarked-image";
import { getPromptBySlug, getPrompts } from "@/lib/prompts";
import { siteConfig } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPrompts().map((prompt) => ({ slug: prompt.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const prompt = getPromptBySlug(slug);

  if (!prompt) {
    return { title: "Prompt not found" };
  }

  const description = `Reveal and copy the full “${prompt.title}” AI image prompt from Social.bil Prompts.`;

  return {
    title: prompt.title,
    description,
    alternates: {
      canonical: `/p/${prompt.slug}`,
    },
    openGraph: {
      type: "article",
      url: `${siteConfig.url}/p/${prompt.slug}`,
      title: prompt.title,
      description,
      images: [
        {
          url: prompt.image,
          alt: prompt.title,
        },
      ],
      publishedTime: prompt.createdAt,
    },
    twitter: {
      card: "summary_large_image",
      title: prompt.title,
      description,
      images: [prompt.image],
    },
  };
}

export default async function PromptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prompt = getPromptBySlug(slug);

  if (!prompt) {
    notFound();
  }

  return (
    <article className="page-enter mx-auto max-w-7xl px-5 pb-8 pt-8 sm:px-8 sm:pt-12 lg:px-10 lg:pt-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-black/50 transition-colors hover:text-black sm:mb-10"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Back to collection
      </Link>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-14 xl:gap-20">
        <WatermarkedImage
          src={prompt.image}
          alt={prompt.title}
          priority
          sizes="(max-width: 1023px) 100vw, 55vw"
          className="aspect-[4/5] rounded-[1.75rem] shadow-[0_2px_4px_rgb(0_0_0/0.03),0_24px_70px_rgb(0_0_0/0.10)]"
        />

        <div className="lg:sticky lg:top-10 lg:pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/38">
            Premium AI prompt
          </p>
          <h1 className="mt-4 text-[clamp(2.2rem,5vw,4.2rem)] font-semibold leading-[1.02] tracking-[-0.055em]">
            {prompt.title}
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-black/50 sm:text-base">
            Reveal the complete creative direction used for this image, then
            copy it in one click for your own AI workflow.
          </p>
          <div className="mt-8">
            <PromptActions prompt={prompt.prompt} title={prompt.title} />
          </div>
        </div>
      </div>
    </article>
  );
}
