import { defineConfig } from 'vite';

export default defineConfig({
  base: "/YadroTest/",
  server: {
    proxy: {
      '/api': {
        target: 'http://impulse.yadro.msk.ru:8008',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
});
