import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = {
    '/api': {
      target: env.CONNECTO_API_TARGET || 'http://localhost:5247',
      changeOrigin: true,
    },
  };
  return { server: { proxy }, preview: { proxy } };
});
