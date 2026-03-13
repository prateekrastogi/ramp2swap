// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    inspectorPort: 9230,
    platformProxy: {
      enabled: true
    },

    imageService: "cloudflare"
  })
});
