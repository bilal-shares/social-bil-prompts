import { Sparkles } from "lucide-react";

export function EmptyState() {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-[#fafaf8] px-6 py-20 text-center sm:py-28">
      <span className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <Sparkles aria-hidden="true" size={20} />
      </span>
      <h2 className="text-xl font-semibold tracking-[-0.03em]">
        The collection is being curated
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-black/50">
        New premium AI prompts will appear here as soon as they are published.
      </p>
    </div>
  );
}
