import nodePolyfills from 'rollup-plugin-node-polyfills'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import pkg from './package.json'

export default [
  {
    input: 'src/index.js',
    output: {
      name: 'TinhteApi',
      file: pkg.browser,
      format: 'umd'
    },
    plugins: [
      nodePolyfills(),
      resolve(),
      commonjs()
    ]
  },

  {
    input: 'src/index.js',
    external: Object.keys(pkg.dependencies),
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: [
      resolve({
        preferBuiltins: true
      })
    ]
  }
]
