# Social.bil Prompts

A production-ready AI prompt gallery built with Next.js, TypeScript, Tailwind
CSS, Cloudflare Pages Functions, and GitHub-backed content storage.

## Features

- Responsive, mobile-first prompt gallery with newest prompts first
- Static prompt pages at `/p/[slug]`
- Hidden prompts with reveal, copy, and share controls
- Centered `Instagram: @social.bil` image watermark
- Dynamic title, description, Open Graph, Twitter card, sitemap, and robots data
- Secure admin dashboard at `/secure-admin-bilal`
- Signed HttpOnly sessions, same-origin mutation checks, and login throttling
- JPG, JPEG, PNG, and WEBP upload support
- Browser-side WEBP conversion, resizing, and compression
- Server-side file signature, dimension, size, and input validation
- Atomic GitHub commits for prompt data and image changes
- Automatic Cloudflare Pages deployments after admin changes

## Architecture

The public site is a Next.js static export served from Cloudflare's CDN.
Cloudflare Pages Functions provide the authenticated admin API.

Admin mutations create a single Git commit containing all required changes:

- Images are stored in `public/images`
- Prompt records are stored in `data/prompts.json`
- Cloudflare's Git integration detects the commit and rebuilds the static site

This keeps public page requests fast and database-free. A newly uploaded prompt
appears publicly after the triggered Pages deployment completes.

## Local Development

Requirements:

- Node.js 22 or newer
- npm 10 or newer

Install dependencies:

```bash
npm install
```

Create the local Pages Functions environment file:

```powershell
Copy-Item .dev.vars.example .dev.vars
```

Fill in `.dev.vars`. Never commit this file.

Admin login only needs `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and
`SESSION_SECRET`. Loading, uploading, editing, and deleting prompts also
requires a valid replacement `GITHUB_TOKEN`. Restart the local server after
changing `.dev.vars`.

Create the public build environment file:

```powershell
Copy-Item .env.example .env.local
```

Run the complete local application, including Cloudflare Pages Functions:

```bash
npm run dev
```

Open `http://localhost:3000`. This is the correct command for testing admin
login and GitHub-backed CRUD.

For frontend UI-only development with Next.js hot reload:

```bash
npm run dev:ui
```

`npm run dev:ui` does not run Pages Functions, so admin login and `/api/admin/*`
will not work in that mode.

## Environment Variables

Configure these for both Production and Preview in Cloudflare Pages:

| Variable | Secret | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | Yes | Fine-grained GitHub token |
| `GITHUB_OWNER` | No | `bilal-shares` |
| `GITHUB_REPO` | No | `social-bil-prompts` |
| `GITHUB_BRANCH` | No | `main` |
| `ADMIN_USERNAME` | Yes | Admin login username |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `SESSION_SECRET` | Yes | Session-signing key, at least 32 characters |
| `NEXT_PUBLIC_SITE_URL` | No | Production URL without a trailing slash |

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` to the requested login values directly
in Cloudflare. They are intentionally absent from the repository and browser
bundle.

Generate a strong session secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## GitHub Token Setup

The token previously shared in chat must be revoked because it is exposed.
Do not reuse or commit it.

1. Open GitHub **Settings > Developer settings > Personal access tokens >
   Fine-grained tokens**.
2. Create a token owned by `bilal-shares`.
3. Select **Only select repositories** and choose `social-bil-prompts`.
4. Under **Repository permissions**, set **Contents** to **Read and write**.
5. Use a sensible expiration date.
6. Store the replacement token only as the encrypted Cloudflare
   `GITHUB_TOKEN` secret.

GitHub token documentation:
[Managing personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

## GitHub Repository Setup

The repository is:

```text
https://github.com/bilal-shares/social-bil-prompts
```

Commit and push the initial application:

```bash
git add .
git commit -m "Build Social.bil Prompts"
git push -u origin main
```

The repository must contain at least one commit before Cloudflare can select
`main` as the production branch.

## Cloudflare Pages Deployment

1. In Cloudflare, open **Workers & Pages**.
2. Select **Create application > Pages > Connect to Git**.
3. Select `bilal-shares/social-bil-prompts`.
4. Use these build settings:

| Setting | Value |
| --- | --- |
| Project name | `bilal-prompt` |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `out` |
| Root directory | `/` |

5. Add `NODE_VERSION=22` to the build environment.
6. Add every variable listed in **Environment Variables**. Encrypt all values
   marked as secrets.
7. Set `NEXT_PUBLIC_SITE_URL` to
   `https://bilal-prompt.pages.dev`, or to the final custom domain.
8. Select **Save and Deploy**.

Cloudflare automatically detects the root `functions` directory and deploys the
admin API alongside the static `out` directory.

Official references:

- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/)
- [Pages secrets](https://developers.cloudflare.com/pages/functions/bindings/#secrets)

## Admin Workflow

1. Visit `/secure-admin-bilal`.
2. Sign in with the Cloudflare-configured admin credentials.
3. Upload, edit, or delete prompts.
4. The API validates the request and creates an atomic GitHub commit.
5. Cloudflare rebuilds and publishes the updated collection.

Changing a prompt title also updates its generated slug. Duplicate titles are
given `-2`, `-3`, and later suffixes automatically.

## Verification

Run all production checks:

```bash
npm run typecheck
npm run lint
npm run build
npm run functions:build
npm audit --omit=dev
```

## Security Notes

- Secrets never enter frontend code or static HTML.
- Admin sessions expire after eight hours.
- Session cookies are `HttpOnly`, `Secure`, and `SameSite=Strict`.
- Mutating API requests require a same-origin `Origin` header.
- Images are resized to at most 2000 px, capped at 2 MB by the browser, and
  validated again by Pages Functions after client optimization.
- Security headers and a restrictive Content Security Policy are configured in
  `public/_headers`.
- Configure a Cloudflare rate-limiting rule for `/api/admin/login` for stronger
  distributed brute-force protection.
