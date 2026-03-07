export function cookieCleanerMiddleware() {
  return {
    name: 'cookie-cleaner',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/setIsSelect')) {
          res.statusCode = 204;
          res.end();
          return;
        }
        // Remover TODOS os cookies das requisições
        delete req.headers.cookie;
        delete req.headers['set-cookie'];
        
        // Interceptar response para não enviar cookies
        const originalWriteHead = res.writeHead;
        res.writeHead = function(statusCode, headers) {
          if (headers) {
            delete headers['set-cookie'];
            delete headers['Set-Cookie'];
          }
          return originalWriteHead.apply(this, arguments);
        };
        
        next();
      });
    },
  };
}
