# Flux API — Documentation site

Documentation and presentation site for [Flux API](https://github.com/PedroL3m0z/Flux-Api), an HTTP gateway for Telegram. Built with [Astro Starlight](https://starlight.astro.build).

**Live:** https://pedrol3m0z.github.io/flux-docs/

## Develop

```bash
npm install
npm run dev      # http://localhost:4321/flux-docs/
```

## Build

```bash
npm run build    # output in dist/
npm run preview  # serve the production build locally
```

## Structure

```
src/
├── assets/                 # logo and images
├── content.config.ts       # Starlight content collection
└── content/docs/
    ├── index.mdx           # landing (splash)
    ├── guides/             # introduction, getting-started, how-it-works, events, webhooks, auth
    └── reference/          # endpoints, architecture, configuration
astro.config.mjs            # site/base, sidebar, image service
.github/workflows/deploy.yml # GitHub Pages deploy
```

## Deployment

Pushing to `main` builds and deploys to GitHub Pages via Actions
(`.github/workflows/deploy.yml`). In the repo settings, set **Pages → Source →
GitHub Actions**.

The `site` (`https://pedrol3m0z.github.io`) and `base` (`/flux-docs`) in
`astro.config.mjs` must match the repository name; change them if you rename the
repo or move to a custom domain.

## Notes

Astro's default image pipeline (Sharp) is disabled in favor of
`passthroughImageService()` so local builds work on Windows machines with Smart
App Control enabled (which blocks Sharp's unsigned native binary). CI on Linux is
unaffected either way.

## License

Apache 2.0 © Pedro Lemos
