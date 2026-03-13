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
  ...(command === 'build'
    ? {
        output: 'server',
        adapter: cloudflare({
          inspectorPort: 9231,
          platformProxy: {
            enabled: platformProxyEnabled
          },
          imageService: 'cloudflare'
        })
      }
    : {})
}));
