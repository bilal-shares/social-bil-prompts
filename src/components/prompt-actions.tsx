"use client";

import { Check, Copy, Eye, Share2 } from "lucide-react";
import { useState } from "react";

async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand("copy");
    textArea.remove();

    if (!copied) {
      throw new Error("Clipboard access is unavailable.");
    }
  }
}

export function PromptActions({
  prompt,
  title,
}: {
  prompt: string;
  title: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  async function copyPrompt() {
    try {
      await copyText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert("Could not access the clipboard. Please select the prompt manually.");
    }
  }

  async function sharePrompt() {
    const shareData = {
      title: `${title} | Social.bil Prompts`,
      text: `Explore the “${title}” AI image prompt.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShared(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        await copyText(window.location.href);
        setShared(true);
      }
    } else {
      await copyText(window.location.href);
      setShared(true);
    }

    window.setTimeout(() => setShared(false), 2000);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Eye aria-hidden="true" size={17} />
            Reveal Prompt
          </button>
        ) : null}
        <button
          type="button"
          onClick={sharePrompt}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/12 px-6 text-sm font-semibold text-black transition-colors hover:border-black hover:bg-black hover:text-white"
        >
          {shared ? (
            <Check aria-hidden="true" size={17} />
          ) : (
            <Share2 aria-hidden="true" size={17} />
          )}
          {shared ? "Link copied" : "Share"}
        </button>
      </div>

      {revealed ? (
        <div className="page-enter mt-7 rounded-[1.5rem] border border-black/8 bg-[#f7f7f5] p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">
              Full prompt
            </p>
            <button
              type="button"
              onClick={copyPrompt}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-sm ring-1 ring-black/6 transition-colors hover:bg-black hover:text-white"
            >
              {copied ? (
                <Check aria-hidden="true" size={14} />
              ) : (
                <Copy aria-hidden="true" size={14} />
              )}
              {copied ? "Copied" : "Copy Prompt"}
            </button>
          </div>
          <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-black/75">
            {prompt}
          </p>
        </div>
      ) : (
        <div className="mt-7 overflow-hidden rounded-[1.5rem] border border-black/7 bg-[#f7f7f5] p-6">
          <div className="space-y-3 blur-[6px]" aria-hidden="true">
            <div className="h-3 w-full rounded-full bg-black/14" />
            <div className="h-3 w-[92%] rounded-full bg-black/14" />
            <div className="h-3 w-[84%] rounded-full bg-black/14" />
          </div>
          <p className="mt-5 text-center text-xs font-medium text-black/42">
            The prompt is hidden until you reveal it.
          </p>
        </div>
      )}
    </div>
  );
}
