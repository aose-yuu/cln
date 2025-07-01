import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    './src/index',
    './src/cli'
  ],
  outDir: 'dist',
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: false,
    esbuild: {
      target: 'node16',
      minify: false
    }
  },
  externals: [
    'ink',
    'ink-ui',
    'react',
    'chalk',
    'commander',
    'execa',
    'open'
  ]
});