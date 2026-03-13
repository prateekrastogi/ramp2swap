// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
const disableCloudflareAdapter = process.env.ASTRO_DISABLE_CLOUDFLARE_ADAPTER === 'true';

// https://astro.build/config
export default defineConfig({
  ...(disableCloudflareAdapter
    ? {}
    : {
        output: 'server',
        adapter: cloudflare({
          inspectorPort: 9230,
          platformProxy: {
            enabled: true
          },
          imageService: 'cloudflare'
        })
      })
});
