import { defineConfig } from 'vite';

export default defineConfig({
  // A raiz do servidor de desenvolvimento
  root: '.', 

  // Onde estão seus arquivos estáticos (ROMs)
  publicDir: 'public',

  build: {
    // Para onde vai o site quando rodar 'npm run build'
    outDir: 'dist/web',
    emptyOutDir: true,
    
    // Configuração para garantir que o JavaScript seja moderno
    target: 'esnext' 
  },

  server: {
    // Abre o navegador automaticamente
    open: true
  }
});