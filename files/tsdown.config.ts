import { defineConfig } from 'tsdown'

export default defineConfig({
  name: '@deepseek-ai/dsh-eva-files',
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  clean: false,
  dts: false,
  external: ['@deepseek-ai/cordis'],
})
