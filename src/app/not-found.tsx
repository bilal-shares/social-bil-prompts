import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-28 text-center sm:py-40">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/38">
        404
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
        Prompt not found
      </h1>
      <p className="mt-4 text-sm leading-6 text-black/50">
        This prompt may have moved or is no longer part of the collection.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Back to collection
      </Link>
    </div>
  );
}
