import { exec } from 'child_process';

console.log('⏳ Aguardando 3 segundos para Next.js inicializar...');

setTimeout(() => {
  console.log('🚀 Iniciando Vite...');
  
  const vite = exec('node --max-http-header-size=1000000 node_modules/vite/bin/vite.js --port 5173 --host 127.0.0.1');
  
  vite.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
  
  vite.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  
  vite.on('close', (code) => {
    console.log(`Vite encerrado com código ${code}`);
    process.exit(code);
  });
  
  process.on('SIGINT', () => {
    vite.kill();
    process.exit();
  });
  
  process.on('SIGTERM', () => {
    vite.kill();
    process.exit();
  });
  
}, 3000);
