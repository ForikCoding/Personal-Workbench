import { defineConfig } from 'vitest/config'

// The workbench's own CSS Modules are part of the unit under test, so Vite
// compiles them here rather than Vitest stubbing them out. Class names are
// derived from the same lightningcss pipeline the bundle uses.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    css: {
      modules: { classNameStrategy: 'non-scoped' },
    },
  },
})
