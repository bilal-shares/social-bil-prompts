import { Camera } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-black/6 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.02em] text-black sm:text-base"
          aria-label="Social.bil Prompts home"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-black text-white transition-transform duration-300 group-hover:-rotate-3">
            <Camera aria-hidden="true" size={17} strokeWidth={2} />
          </span>
          <span>Social.bil Prompts</span>
        </Link>
        <a
          href="https://www.instagram.com/social.bil/"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-black/10 px-4 py-2 text-xs font-medium text-black transition-colors hover:border-black hover:bg-black hover:text-white sm:text-sm"
        >
          @social.bil
        </a>
      </div>
    </header>
  );
}
