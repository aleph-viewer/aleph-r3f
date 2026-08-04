import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import dts from 'vite-plugin-dts';

// Vercel and the GitHub Pages workflow both build the demo app (index.html) rather than
// the library; only their base path differs (Vercel serves from root, Pages from a repo subpath).
const isVercel = process.env.VERCEL === '1';
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const isDemoBuild = isVercel || isGithubPages;

export default defineConfig({
  // Relative base for the library build so worker/asset URLs resolve against the package's own
  // files, not the consuming app's origin.
  base: isGithubPages ? '/aleph-r3f/' : isDemoBuild ? '/' : './',
  plugins: [react(), dts()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: isDemoBuild
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
