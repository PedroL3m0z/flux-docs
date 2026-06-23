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
        'How to use Flux API — an HTTP gateway that runs Telegram accounts as instances behind a REST API, realtime events and webhooks.',
      logo: { src: './src/assets/logo.png', alt: 'Flux API' },
      favicon: '/icon.svg',
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
        { label: 'Getting started', slug: 'getting-started' },
        { label: 'Authentication', slug: 'authentication' },
        { label: 'Telegram credentials', slug: 'telegram-credentials' },
        { label: 'Instances', slug: 'instances' },
        { label: 'Sessions', slug: 'sessions' },
        { label: 'Engines', slug: 'engines' },
        { label: 'Webhooks', slug: 'webhooks' },
        { label: 'Events', slug: 'events' },
        { label: 'Accounts', slug: 'accounts' },
      ],
    }),
  ],
});
