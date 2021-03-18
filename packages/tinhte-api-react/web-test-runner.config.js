const rollupCommonjs = require('@rollup/plugin-commonjs')
const rollupNodePolyfills = require('rollup-plugin-node-polyfills')
const { esbuildPlugin } = require('@web/dev-server-esbuild')
const { fromRollup } = require('@web/dev-server-rollup')
const { puppeteerLauncher } = require('@web/test-runner-puppeteer')

const patcher = fromRollup(() => ({
  name: 'patcher',
  transform: (code, id) => {
    code = code.replace(/process\.env\.NODE_ENV/g, '"production"')

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

module.exports = {
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
