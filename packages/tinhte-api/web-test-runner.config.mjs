import rollupCommonjs from '@rollup/plugin-commonjs'
import rollupNodePolyfills from 'rollup-plugin-node-polyfills'
import { fromRollup } from '@web/dev-server-rollup'
import { puppeteerLauncher } from '@web/test-runner-puppeteer'

const commonjs = fromRollup(rollupCommonjs)
const nodePolyfills = fromRollup(rollupNodePolyfills)

export default {
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
