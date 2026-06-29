// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import starlight from '@astrojs/starlight';

// Project site on GitHub Pages → https://pedrol3m0z.github.io/Flux-Docs/
// `site` + `base` must match the repo name exactly (case-sensitive) so asset
// links resolve. Repo is `Flux-Docs`, so `base` must keep that capitalization.
export default defineConfig({
  site: 'https://pedrol3m0z.github.io',
  base: '/Flux-Docs',
  // Skip Sharp's native image pipeline: it ships an unsigned .node binary that
  // Windows Smart App Control blocks, breaking local builds. The docs use only
  // a couple of static images, so passthrough is fine; CI (Linux) is unaffected.
  image: { service: passthroughImageService() },
  integrations: [
    starlight({
      title: 'Flux API',
      description:
        'How to use Flux API — an HTTP gateway that runs Telegram accounts as instances behind a REST API, realtime events and webhooks.',
      logo: { src: './src/assets/icon.png', alt: 'Flux API', replacesTitle: true },
      favicon: '/icon.png',
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
      // English at the site root, Brazilian Portuguese under /pt-br/.
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        'pt-br': { label: 'Português (BR)', lang: 'pt-BR' },
      },
      sidebar: [
        { label: 'Getting started', translations: { 'pt-BR': 'Primeiros passos' }, slug: 'getting-started' },
        { label: 'How it works', translations: { 'pt-BR': 'Como funciona' }, slug: 'how-it-works' },
        { label: 'Authentication', translations: { 'pt-BR': 'Autenticação' }, slug: 'authentication' },
        { label: 'Telegram credentials', translations: { 'pt-BR': 'Credenciais do Telegram' }, slug: 'telegram-credentials' },
        { label: 'Instances', translations: { 'pt-BR': 'Instâncias' }, slug: 'instances' },
        { label: 'Sessions', translations: { 'pt-BR': 'Sessões' }, slug: 'sessions' },
        { label: 'Messaging', translations: { 'pt-BR': 'Mensagens' }, slug: 'messaging' },
        { label: 'Engines', translations: { 'pt-BR': 'Engines' }, slug: 'engines' },
        { label: 'Webhooks', translations: { 'pt-BR': 'Webhooks' }, slug: 'webhooks' },
        { label: 'Events', translations: { 'pt-BR': 'Eventos' }, slug: 'events' },
        { label: 'Accounts', translations: { 'pt-BR': 'Contas' }, slug: 'accounts' },
        { label: 'API reference', translations: { 'pt-BR': 'Referência da API' }, slug: 'api-reference' },
        { label: 'Types & contracts', translations: { 'pt-BR': 'Tipos e contratos' }, slug: 'types' },
        { label: 'Contributing', translations: { 'pt-BR': 'Contribuindo' }, slug: 'contributing' },
      ],
    }),
  ],
});
