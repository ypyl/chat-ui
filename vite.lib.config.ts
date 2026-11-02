import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

// Library build: `npm run build:lib`. Emits dist/index.js, dist/styles.css and dist/index.d.ts.
export default defineConfig({
  // No demo assets in the package.
  publicDir: false,
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.lib.json',
      include: ['src/lib'],
      insertTypesEntry: true,
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: fileURLToPath(new URL('./src/lib/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'styles',
    },
    rollupOptions: {
      // Never bundle what the host app already has: React, Mantine and the peer-installed deps.
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-dom/client',
        '@mantine/core',
        '@mantine/hooks',
        '@ag-ui/client',
        '@ag-ui/core',
        '@tabler/icons-react',
        'react-markdown',
        'remark-gfm',
        'zustand',
        /^zustand\//,
      ],
    },
  },
})
