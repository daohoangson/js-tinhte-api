const rollupNodePolyfills = require('rollup-plugin-node-polyfills')
const rollupTypescript = require('@rollup/plugin-typescript')
const { fromRollup } = require('@web/dev-server-rollup')
const { puppeteerLauncher } = require('@web/test-runner-puppeteer')

const nodePolyfills = fromRollup(rollupNodePolyfills)
const typescript = fromRollup(rollupTypescript)

module.exports = {
  files: [
    'src/**/*.test.js'
  ],
  nodeResolve: true,
  plugins: [
    nodePolyfills(),
    typescript()
  ],
  rootDir: '../..',
  browsers: [
    puppeteerLauncher()
  ]
}
