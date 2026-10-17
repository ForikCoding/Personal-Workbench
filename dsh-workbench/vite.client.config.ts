import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const { name } = JSON.parse(readFileSync('package.json', 'utf8')) as { name: string }

// The Loader hands a client bundle a synchronous `require` over the frozen
// module table, so the artifact is one CJS factory wrapped in the handshake.
// Every `@deepseek-ai/*` import stays external: the module table decides what
// resolves, so a value import outside the shared baseline fails loudly at load
// instead of silently inlining a second copy of an upstream runtime.
//
// No JSX transform plugin is configured because none is needed: the entry file
// is plain TypeScript, and the components it imports were already compiled to
// the automatic runtime by tsc.
export default defineConfig({
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'lib',
    emptyOutDir: false,
    target: 'es2022',
    minify: false,
    lib: { entry: 'src/client/index.ts', formats: ['cjs'], fileName: () => 'client.js' },
    rollupOptions: {
      external: id => /^(react(?:-dom)?(?:\/|$)|@deepseek-ai\/)/u.test(id),
      output: {
        codeSplitting: false,
        banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(name)}, factory: (require) => {`,
        intro: 'var module = { exports: {} }; var exports = module.exports;',
        footer: 'return module.exports; } });',
      },
    },
  },
})
