import { Instagram, MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-black/7 sm:mt-32">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <p className="text-sm text-black/48">
          © {new Date().getFullYear()} Social.bil Prompts
        </p>
        <div className="flex flex-wrap items-center gap-5 text-sm font-medium">
          <a
            href={siteConfig.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-black/70 transition-colors hover:text-black"
          >
            <Instagram aria-hidden="true" size={16} />
            Instagram: @social.bil
          </a>
          <a
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-black/70 transition-colors hover:text-black"
          >
            <MessageCircle aria-hidden="true" size={16} />
            WhatsApp: +91 7017727563
          </a>
        </div>
      </div>
    </footer>
  );
}
