
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 提供されたAPIキーをアプリ全体で利用可能にする
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || 'AIzaSyCc6rx2TIZqp-ZFO4us0I3KBCqSpUPkPLg'),
  },
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  }
});
