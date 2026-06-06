import { EmptyState } from "@/components/empty-state";
import { PromptCard } from "@/components/prompt-card";
import { getPrompts } from "@/lib/prompts";

export default function HomePage() {
  const prompts = getPrompts();

  return (
    <div className="page-enter">
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-18 sm:px-8 sm:pb-16 sm:pt-24 lg:px-10 lg:pt-28">
        <div className="max-w-3xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
            Curated for creators
          </p>
          <h1 className="text-[clamp(2.6rem,7vw,5.8rem)] font-semibold leading-[0.94] tracking-[-0.065em] text-black">
            Premium AI
            <br />
            Prompts Collection
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-black/52 sm:text-lg sm:leading-8">
            Discover carefully crafted prompts behind striking AI imagery. Open
            any creation to reveal and copy its full prompt.
          </p>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"
        aria-labelledby="collection-heading"
      >
        <div className="mb-7 flex items-end justify-between border-b border-black/8 pb-4 sm:mb-9">
          <h2
            id="collection-heading"
            className="text-sm font-semibold tracking-[-0.01em]"
          >
            Latest prompts
          </h2>
          <p className="text-xs text-black/42">
            {prompts.length} {prompts.length === 1 ? "creation" : "creations"}
          </p>
        </div>

        {prompts.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-11 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-7 lg:gap-y-14">
            {prompts.map((prompt, index) => (
              <PromptCard key={prompt.id} prompt={prompt} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}
