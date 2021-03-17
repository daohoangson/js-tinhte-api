import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import rollupCommonjs from '@rollup/plugin-commonjs'
import rollupNodePolyfills from 'rollup-plugin-node-polyfills'
import { importMapsPlugin } from '@web/dev-server-import-maps'
import { fromRollup } from '@web/dev-server-rollup'
import { puppeteerLauncher } from '@web/test-runner-puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const commonjs = fromRollup(rollupCommonjs)
const nodePolyfills = fromRollup(rollupNodePolyfills)

export default {
  files: [
    'src/**/*.test.js'
  ],
  nodeResolve: true,
  plugins: [
    importMapsPlugin({
      inject: {
        importMap: {
          imports: {
            'mime-db': join(__dirname, 'mocks/mime-db.js')
          }
        }
      }
    }),
    commonjs(),
    nodePolyfills()
  ],
  browsers: [
    puppeteerLauncher()
  ]
}
