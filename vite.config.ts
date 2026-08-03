import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import dts from 'vite-plugin-dts';

// Check if the build is running on Vercel
const isVercel = process.env.VERCEL === '1';

export default defineConfig({
  // Relative base so worker/asset URLs resolve against the package's own files, not the consuming app's origin.
  base: isVercel ? '/' : './',
  plugins: [react(), dts()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: isVercel
    ? {
        outDir: 'dist', // output build files to 'dist' directory
        emptyOutDir: true, // empty the output directory before build
        rollupOptions: {
          input: resolve(__dirname, 'index.html'), // entry point for the application
        },
      }
    : {
        lib: {
          entry: resolve(__dirname, 'index.ts'),
          name: 'Aleph',
          fileName: (format) => `index.${format}.js`,
        },
        cssCodeSplit: false,
        rollupOptions: {
          external: ['react', 'react-dom'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
            },
          },
        },
        sourcemap: true,
        emptyOutDir: true,
      },
  server: {
    port: 3000,
  },
});
