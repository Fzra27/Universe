import {defineConfig} from 'vite';
export default defineConfig(({command})=>({
  base: command==='build' && process.env.GITHUB_ACTIONS ? '/Universe/' : '/',
  build:{rollupOptions:{output:{manualChunks:{three:['three']}}}},
}));
