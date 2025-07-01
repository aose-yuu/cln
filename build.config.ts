import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    './src/index',
    './src/cli'
  ],
  outDir: 'dist',
  declaration: true,
  clean: true,
  failOnWarn: false, // Don't fail on warnings
  rollup: {
    emitCJS: false, // Disable CJS build since ora is ESM-only
    inlineDependencies: false,
    esbuild: {
      target: 'node16',
      minify: false
    }
  },
  externals: [
    'chalk',
    'commander',
    'execa',
    'open',
    'ora',
    'prompts',
    'picocolors'
  ]
});