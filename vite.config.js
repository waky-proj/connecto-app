import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = {
    '/api': {
      target: env.CONNECTO_API_TARGET || 'http://localhost:5247',
      changeOrigin: true,
      configure(proxyServer) {
        proxyServer.on('proxyReq', (proxyRequest) => {
          proxyRequest.setTimeout(10000, () => {
            const error = new Error('Connecto API response timed out.');
            error.code = 'ETIMEDOUT';
            proxyRequest.destroy(error);
          });
        });
        proxyServer.on('error', (error, request, response) => {
          if (
            !response ||
            response.headersSent ||
            response.writableEnded ||
            !response.writeHead
          )
            return;
          const timedOut = error.code === 'ETIMEDOUT';
          response.writeHead(timedOut ? 504 : 502, {
            'Content-Type': 'application/problem+json',
          });
          response.end(
            JSON.stringify({
              title: timedOut ? 'Connecto API timed out' : 'Connecto API is unavailable',
              detail: timedOut
                ? 'The backend did not respond within 10 seconds. Check the backend debugger and database connection. A submitted post may still have been saved; check before resubmitting.'
                : 'The frontend proxy could not connect to the backend. Check that Connecto.Api is running and CONNECTO_API_TARGET is correct.',
              status: timedOut ? 504 : 502,
            }),
          );
        });
      },
    },
  };
  return { esbuild: { jsx: 'automatic' }, server: { proxy }, preview: { proxy } };
});
