// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import starlight from '@astrojs/starlight';

// Project site on GitHub Pages → https://pedrol3m0z.github.io/flux-docs/
// `site` + `base` must match the repo name so internal links resolve.
export default defineConfig({
  site: 'https://pedrol3m0z.github.io',
  base: '/flux-docs',
  // Skip Sharp's native image pipeline: it ships an unsigned .node binary that
  // Windows Smart App Control blocks, breaking local builds. The docs use only
  // a couple of static images, so passthrough is fine; CI (Linux) is unaffected.
  image: { service: passthroughImageService() },
  integrations: [
    starlight({
      title: 'Flux API',
      description:
        'HTTP gateway for Telegram — run accounts as instances behind a clean REST API, realtime SSE and signed webhooks.',
      logo: { src: './src/assets/logo.png', alt: 'Flux API' },
      favicon: '/favicon.svg',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/PedroL3m0z/Flux-Api',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/PedroL3m0z/flux-docs/edit/main/',
      },
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Introduction', slug: 'guides/introduction' },
            { label: 'Getting started', slug: 'guides/getting-started' },
            { label: 'How it works', slug: 'guides/how-it-works' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Events', slug: 'guides/events' },
            { label: 'Webhooks', slug: 'guides/webhooks' },
            { label: 'Auth & security', slug: 'guides/auth' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Endpoints', slug: 'reference/endpoints' },
            { label: 'Architecture', slug: 'reference/architecture' },
            { label: 'Configuration', slug: 'reference/configuration' },
          ],
        },
      ],
    }),
  ],
});
