import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // API_KEYが未設定の場合でもビルドが通るように空文字にフォールバック
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  }
});