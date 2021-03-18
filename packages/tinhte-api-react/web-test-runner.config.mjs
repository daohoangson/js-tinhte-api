import rollupCommonjs from '@rollup/plugin-commonjs'
import rollupNodePolyfills from 'rollup-plugin-node-polyfills'
import { esbuildPlugin } from '@web/dev-server-esbuild'
import { fromRollup } from '@web/dev-server-rollup'
import { puppeteerLauncher } from '@web/test-runner-puppeteer'

const patcher = fromRollup(() => ({
  name: 'patcher',
  transform: (code, id) => {
    if (id.endsWith('/react-ssr-prepass.es.js')) {
      return code.replace(
        'import React, { Children, createElement } from "react";',
        'import React from "react";\n' +
        'const { Children, createElement } = React;\n'
      )
    }

    if (id.endsWith('/Callback.jsx')) {
      return code.replace('process.browser', 'true')
    }

    return code
  }
}))

const commonjs = fromRollup(rollupCommonjs)
const nodePolyfills = fromRollup(rollupNodePolyfills)

export default {
  files: [
    'src/**/*.test.{js,jsx}'
  ],
  nodeResolve: true,
  plugins: [
    patcher(),

    commonjs(),
    esbuildPlugin({
      jsx: true
    }),
    nodePolyfills()
  ],
  rootDir: '../..',
  browsers: [
    puppeteerLauncher()
  ],
  coverageConfig: {
    include: [
      'src/**/*.{js,jsx}'
    ]
  }
}
