import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'url';
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [{ find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.vue', '.tsx', '.json'],
  },
  plugins: [vue()],
})
