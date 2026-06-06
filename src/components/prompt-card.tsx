import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Prompt } from "@/types/prompt";
import { WatermarkedImage } from "./watermarked-image";

export function PromptCard({
  prompt,
  index,
}: {
  prompt: Prompt;
  index: number;
}) {
  return (
    <article
      className="card-enter group min-w-0"
      style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
    >
      <Link href={`/p/${prompt.slug}`} className="block">
        <WatermarkedImage
          src={prompt.image}
          alt={prompt.title}
          priority={index < 4}
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          className="aspect-[4/5] rounded-[1.4rem] shadow-[0_1px_2px_rgb(0_0_0/0.03),0_12px_35px_rgb(0_0_0/0.07)] transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_2px_4px_rgb(0_0_0/0.04),0_20px_45px_rgb(0_0_0/0.12)]"
        />
        <div className="flex items-start justify-between gap-4 px-1 pt-4">
          <h2 className="text-[15px] font-semibold leading-snug tracking-[-0.02em] text-black sm:text-base">
            {prompt.title}
          </h2>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-black/50 transition-colors group-hover:text-black">
            View Prompt
            <ArrowUpRight aria-hidden="true" size={14} />
          </span>
        </div>
      </Link>
    </article>
  );
}
