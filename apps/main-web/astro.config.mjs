// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

const platformProxyEnabled = process.env.CLOUDFLARE_PLATFORM_PROXY === 'true';

// https://astro.build/config
export default defineConfig(({ command }) => ({
  server: {
    host: true,
    port: 1234
  },
  adapter:
    command === 'build'
      ? cloudflare({
          platformProxy: {
            enabled: platformProxyEnabled
          },
          imageService: 'cloudflare'
        })
      : undefined
}));
