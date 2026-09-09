import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        register: resolve(__dirname, 'account/register.html'),
        login: resolve(__dirname, 'account/login.html'),
        listing: resolve(__dirname, 'listing/index.html'),
        createListing: resolve(__dirname, 'listing/create.html'),
        profile: resolve(__dirname, 'account/profile.html'),
      },
    },
  },
});
