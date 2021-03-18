const rollupCommonjs = require('@rollup/plugin-commonjs')
const rollupNodePolyfills = require('rollup-plugin-node-polyfills')
const { fromRollup } = require('@web/dev-server-rollup')
const { puppeteerLauncher } = require('@web/test-runner-puppeteer')

const commonjs = fromRollup(rollupCommonjs)
const nodePolyfills = fromRollup(rollupNodePolyfills)

module.exports = {
  files: [
    'src/**/*.test.js'
  ],
  nodeResolve: true,
  plugins: [
    commonjs(),
    nodePolyfills()
  ],
  rootDir: '../..',
  browsers: [
    puppeteerLauncher()
  ]
}
