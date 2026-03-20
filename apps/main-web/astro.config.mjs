// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

const platformProxyEnabled = process.env.CLOUDFLARE_PLATFORM_PROXY === 'true';
const disableCloudflareAdapter = process.env.ASTRO_DISABLE_CLOUDFLARE_ADAPTER === 'true';

// https://astro.build/config
export default defineConfig({
  vite: {
    optimizeDeps: {
      include: ['@lifi/widget', '@lifi/wallet-management'],
    },
  },
  server: {
    host: true,
    port: 1234
  },
  ...(disableCloudflareAdapter
    ? {}
    : {
        output: 'server',
        adapter: cloudflare({
          inspectorPort: 9231,
          platformProxy: {
            enabled: platformProxyEnabled
          },
          imageService: 'cloudflare'
        })
      })
});
