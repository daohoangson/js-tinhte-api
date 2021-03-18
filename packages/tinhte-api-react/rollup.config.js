import babel from '@rollup/plugin-babel'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import pkg from './package.json'

const extensions = ['.js', '.jsx']

export default [
  {
    input: 'src/index.js',
    external: Object.keys(pkg.peerDependencies),
    output: {
      name: 'TinhteApiReact',
      file: pkg.browser,
      format: 'umd',
      globals: {
        react: 'React'
      }
    },
    plugins: [
      nodePolyfills(),
      resolve({
        extensions
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        extensions,
        presets: ['@babel/env', '@babel/react']
      })
    ]
  },

  {
    input: 'src/index.js',
    external: [
      ...Object.keys(pkg.peerDependencies),
      ...Object.keys(pkg.dependencies)
    ],
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: [
      resolve({
        extensions,
        preferBuiltins: true
      }),
      babel({
        babelHelpers: 'bundled',
        extensions,
        presets: ['@babel/env', '@babel/react']
      })
    ]
  }
]
