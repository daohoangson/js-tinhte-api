const rollupNodePolyfills = require('rollup-plugin-node-polyfills')
const rollupTs = require('rollup-plugin-ts')
const { fromRollup } = require('@web/dev-server-rollup')
const { puppeteerLauncher } = require('@web/test-runner-puppeteer')

const nodePolyfills = fromRollup(rollupNodePolyfills)
const ts = fromRollup(rollupTs)

module.exports = {
  files: [
    'src/**/*.test.js'
  ],
  mimeTypes: {
    '**/*.ts': 'js'
  },
  nodeResolve: true,
  plugins: [
    nodePolyfills(),
    ts()
  ],
  rootDir: '../..',
  browsers: [
    puppeteerLauncher()
  ]
}
