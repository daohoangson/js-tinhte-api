const rollupCommonjs = require('@rollup/plugin-commonjs')
const rollupNodePolyfills = require('rollup-plugin-node-polyfills')
const { esbuildPlugin } = require('@web/dev-server-esbuild')
const { fromRollup } = require('@web/dev-server-rollup')
const { playwrightLauncher } = require('@web/test-runner-playwright')

const commonjs = fromRollup(rollupCommonjs)
const nodePolyfills = fromRollup(rollupNodePolyfills)

module.exports = {
  files: [
    'src/**/*.test.js'
  ],
  mimeTypes: {
    '**/*.ts': 'js'
  },
  nodeResolve: true,
  plugins: [
    commonjs({
      include: [
        '**/node_modules/crypto-js/**',
      ],
    }),
    esbuildPlugin({
      ts: true
    }),
    nodePolyfills(),
  ],
  rootDir: '../..',
  browsers: [
    playwrightLauncher({ product: 'chromium' })
  ]
}
