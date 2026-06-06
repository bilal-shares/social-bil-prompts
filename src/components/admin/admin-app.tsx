"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Pencil,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  formatBytes,
  processImage,
  type ProcessedImage,
} from "@/lib/image-client";
import type { Prompt } from "@/types/prompt";

interface ApiPayload {
  error?: string;
  authenticated?: boolean;
  prompt?: Prompt;
  prompts?: Prompt[];
}

interface EditorState {
  id?: string;
  title: string;
  prompt: string;
  currentImage?: string;
}

const emptyEditor: EditorState = {
  title: "",
  prompt: "",
};

async function apiRequest(
  input: string,
  init?: RequestInit,
): Promise<ApiPayload> {
  let response: Response;

  try {
    response = await fetch(input, {
      ...init,
      credentials: "same-origin",
      headers: {
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(
      "Admin API is unavailable. Run `npm run dev` to start the full Cloudflare Pages app.",
    );
  }

  if (!response.headers.get("Content-Type")?.includes("application/json")) {
    throw new Error(
      "Admin API is unavailable. Stop the UI-only server and run `npm run dev`.",
    );
  }

  const payload = (await response.json().catch(() => ({}))) as ApiPayload;

  if (!response.ok) {
    throw new Error(payload.error || "Something went wrong.");
  }

  return payload;
}

export function AdminApp() {
  const [authState, setAuthState] = useState<
    "checking" | "logged-out" | "logged-in"
  >("checking");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadPrompts = useCallback(async () => {
    setLoadingPrompts(true);
    setLoadError("");
    try {
      const data = await apiRequest("/api/admin/prompts");
      setPrompts(data.prompts ?? []);
    } catch (error) {
      if (error instanceof Error && /Authentication/.test(error.message)) {
        setAuthState("logged-out");
      } else {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load prompts from GitHub.",
        );
      }
    } finally {
      setLoadingPrompts(false);
    }
  }, []);

  useEffect(() => {
    void apiRequest("/api/admin/session")
      .then(() => {
        setAuthState("logged-in");
        void loadPrompts();
      })
      .catch(() => setAuthState("logged-out"));
  }, [loadPrompts]);

  if (authState === "checking") {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <LoaderCircle
          className="animate-spin text-black/35"
          aria-label="Checking session"
          size={26}
        />
      </div>
    );
  }

  if (authState === "logged-out") {
    return (
      <Login
        onSuccess={() => {
          setAuthState("logged-in");
          void loadPrompts();
        }}
      />
    );
  }

  return (
    <Dashboard
      prompts={prompts}
      loadingPrompts={loadingPrompts}
      loadError={loadError}
      onPromptsChange={setPrompts}
      onLogout={() => {
        setPrompts([]);
        setAuthState("logged-out");
      }}
    />
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await apiRequest("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      onSuccess();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not sign in.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-enter mx-auto max-w-md px-5 py-18 sm:py-24">
      <div className="rounded-[1.75rem] border border-black/8 bg-white p-6 shadow-[0_24px_70px_rgb(0_0_0/0.08)] sm:p-9">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-black text-white">
          <LockKeyhole aria-hidden="true" size={20} />
        </span>
        <h1 className="mt-7 text-3xl font-semibold tracking-[-0.045em]">
          Admin sign in
        </h1>
        <p className="mt-2 text-sm leading-6 text-black/48">
          Manage the Social.bil prompt collection securely.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <Field label="Username" htmlFor="username">
            <input
              id="username"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-black/10 bg-[#fafaf8] px-4 text-sm transition-colors placeholder:text-black/25 focus:border-black focus:bg-white focus:outline-none"
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-black/10 bg-[#fafaf8] px-4 text-sm transition-colors placeholder:text-black/25 focus:border-black focus:bg-white focus:outline-none"
            />
          </Field>
          {error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <LockKeyhole size={17} />
            )}
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Dashboard({
  prompts,
  loadingPrompts,
  loadError,
  onPromptsChange,
  onLogout,
}: {
  prompts: Prompt[];
  loadingPrompts: boolean;
  loadError: string;
  onPromptsChange: (prompts: Prompt[]) => void;
  onLogout: () => void;
}) {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [processedImage, setProcessedImage] =
    useState<ProcessedImage | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function clearImage() {
    if (processedImage) {
      URL.revokeObjectURL(processedImage.previewUrl);
    }
    setProcessedImage(null);
  }

  function closeEditor() {
    clearImage();
    setEditor(null);
    setError("");
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setProcessingImage(true);
    setError("");
    try {
      const nextImage = await processImage(file);
      clearImage();
      setProcessedImage(nextImage);
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : "Could not process the image.",
      );
    } finally {
      setProcessingImage(false);
    }
  }

  async function savePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) {
      return;
    }
    if (!editor.id && !processedImage) {
      setError("Choose an image for the new prompt.");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");
    const form = new FormData();
    form.set("title", editor.title);
    form.set("prompt", editor.prompt);
    if (processedImage) {
      form.set("image", processedImage.file);
    }

    try {
      const data = await apiRequest(
        editor.id
          ? `/api/admin/prompts/${encodeURIComponent(editor.id)}`
          : "/api/admin/prompts",
        {
          method: editor.id ? "PUT" : "POST",
          body: form,
        },
      );
      onPromptsChange(data.prompts ?? []);
      setNotice(
        editor.id
          ? "Prompt updated. Cloudflare is publishing the new version."
          : "Prompt uploaded. Cloudflare is publishing it now.",
      );
      closeEditor();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save the prompt.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function deletePrompt(prompt: Prompt) {
    const confirmed = window.confirm(
      `Delete “${prompt.title}”? This also removes its image from GitHub.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(prompt.id);
    setError("");
    setNotice("");
    try {
      const data = await apiRequest(
        `/api/admin/prompts/${encodeURIComponent(prompt.id)}`,
        { method: "DELETE" },
      );
      onPromptsChange(data.prompts ?? []);
      setNotice(
        "Prompt deleted. Cloudflare is publishing the updated collection.",
      );
      if (editor?.id === prompt.id) {
        closeEditor();
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the prompt.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function logout() {
    try {
      await apiRequest("/api/admin/logout", { method: "POST" });
    } finally {
      onLogout();
    }
  }

  return (
    <div className="page-enter mx-auto max-w-7xl px-5 pb-10 pt-12 sm:px-8 sm:pt-16 lg:px-10">
      <div className="flex flex-col gap-6 border-b border-black/8 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/38">
            Secure dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Prompt library
          </h1>
          <p className="mt-3 text-sm text-black/48">
            {prompts.length} published{" "}
            {prompts.length === 1 ? "prompt" : "prompts"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/10 px-5 text-sm font-semibold transition-colors hover:border-black"
          >
            View site
            <ArrowUpRight size={15} />
          </Link>
          <button
            type="button"
            onClick={() => {
              closeEditor();
              setEditor({ ...emptyEditor });
              setNotice("");
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            New prompt
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex size-11 items-center justify-center rounded-full border border-black/10 transition-colors hover:border-black hover:bg-black hover:text-white"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {notice ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
          <span>{notice}</span>
        </div>
      ) : null}

      {error && !editor ? (
        <div className="mt-6 rounded-2xl bg-red-50 px-4 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loadError ? (
        <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
          {loadError} Add a valid replacement <code>GITHUB_TOKEN</code> to{" "}
          <code>.dev.vars</code>, then restart <code>npm run dev</code>.
        </div>
      ) : null}

      {editor ? (
        <section className="mt-8 rounded-[1.75rem] border border-black/8 bg-[#fafaf8] p-5 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/38">
                {editor.id ? "Edit prompt" : "New prompt"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                {editor.id ? editor.title : "Add to the collection"}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeEditor}
              className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/6"
              aria-label="Close editor"
            >
              <X size={16} />
            </button>
          </div>

          <form
            onSubmit={savePrompt}
            className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]"
          >
            <div className="space-y-5">
              <Field label="Title" htmlFor="prompt-title">
                <input
                  id="prompt-title"
                  required
                  minLength={3}
                  maxLength={120}
                  value={editor.title}
                  onChange={(event) =>
                    setEditor({ ...editor, title: event.target.value })
                  }
                  placeholder="Korean Cherry Blossom Portrait"
                  className="min-h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm transition-colors placeholder:text-black/25 focus:border-black focus:outline-none"
                />
              </Field>
              <Field label="Prompt text" htmlFor="prompt-text">
                <textarea
                  id="prompt-text"
                  required
                  minLength={10}
                  maxLength={20_000}
                  rows={11}
                  value={editor.prompt}
                  onChange={(event) =>
                    setEditor({ ...editor, prompt: event.target.value })
                  }
                  placeholder="Write the full image-generation prompt..."
                  className="w-full resize-y rounded-xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 transition-colors placeholder:text-black/25 focus:border-black focus:outline-none"
                />
              </Field>
              {error ? (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={submitting || processingImage}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-black px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                {submitting ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : (
                  <Save size={17} />
                )}
                {submitting
                  ? "Saving to GitHub..."
                  : editor.id
                    ? "Save changes"
                    : "Publish prompt"}
              </button>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Image</p>
              <label className="group relative block aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl border border-dashed border-black/16 bg-white">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleImageChange}
                />
                {processedImage ? (
                  <>
                    <Image
                      src={processedImage.previewUrl}
                      alt="Processed upload preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                      <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        Replace image
                      </span>
                    </div>
                  </>
                ) : editor.currentImage ? (
                  <>
                    <Image
                      src={editor.currentImage}
                      alt={editor.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                      <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        Replace image
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    {processingImage ? (
                      <LoaderCircle
                        className="animate-spin text-black/35"
                        size={25}
                      />
                    ) : (
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f6f6f3]">
                        <ImagePlus size={20} />
                      </span>
                    )}
                    <p className="mt-4 text-sm font-semibold">
                      {processingImage ? "Optimizing image..." : "Choose image"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-black/40">
                      JPG, PNG or WEBP. Converted and compressed automatically.
                    </p>
                  </div>
                )}
              </label>

              {processedImage ? (
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-black/48">
                  <span>
                    {processedImage.width} × {processedImage.height} ·{" "}
                    {formatBytes(processedImage.file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="font-semibold text-black"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-xs leading-5 text-black/40">
                  Images are resized to a maximum of 2000 px and uploaded as
                  compressed WEBP files.
                </p>
              )}
            </div>
          </form>
        </section>
      ) : null}

      <section className="mt-10">
        {loadingPrompts ? (
          <div className="flex min-h-52 items-center justify-center">
            <LoaderCircle className="animate-spin text-black/35" size={24} />
          </div>
        ) : prompts.length === 0 ? (
          <button
            type="button"
            onClick={() => setEditor({ ...emptyEditor })}
            className="flex min-h-64 w-full flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-black/14 bg-[#fafaf8] px-6 text-center"
          >
            <UploadCloud size={24} />
            <span className="mt-4 text-lg font-semibold tracking-[-0.025em]">
              Upload your first prompt
            </span>
            <span className="mt-2 max-w-sm text-sm leading-6 text-black/45">
              Add an image, title, and full prompt to start the collection.
            </span>
          </button>
        ) : (
          <div className="grid gap-4">
            {prompts.map((prompt) => (
              <article
                key={prompt.id}
                className="flex flex-col gap-4 rounded-2xl border border-black/7 bg-white p-3 shadow-[0_8px_30px_rgb(0_0_0/0.04)] sm:flex-row sm:items-center"
              >
                <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-xl bg-[#f2f2f0] sm:h-28 sm:w-24">
                  <Image
                    src={prompt.image}
                    alt={prompt.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 px-1 sm:px-2">
                  <h3 className="truncate font-semibold tracking-[-0.02em]">
                    {prompt.title}
                  </h3>
                  <p className="mt-1 truncate text-xs text-black/40">
                    /p/{prompt.slug}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-black/52">
                    {prompt.prompt}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2 px-1 pb-1 sm:px-2 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => {
                      closeEditor();
                      setEditor({
                        id: prompt.id,
                        title: prompt.title,
                        prompt: prompt.prompt,
                        currentImage: prompt.image,
                      });
                      setNotice("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 px-4 text-xs font-semibold transition-colors hover:border-black"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deletePrompt(prompt)}
                    disabled={deletingId === prompt.id}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-red-200 px-4 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-45"
                  >
                    {deletingId === prompt.id ? (
                      <LoaderCircle className="animate-spin" size={14} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}
