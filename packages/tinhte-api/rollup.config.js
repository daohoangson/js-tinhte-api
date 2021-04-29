import commonjs from '@rollup/plugin-commonjs'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import resolve from '@rollup/plugin-node-resolve'
import ts from 'rollup-plugin-ts'
import pkg from './package.json'

const input = 'src/index.ts'
const external = Object.keys(pkg.dependencies)

export default [
  {
    input,
    output: {
      name: 'TinhteApi',
      file: pkg.browser,
      format: 'umd',
      sourcemap: true
    },
    plugins: [
      commonjs(),
      nodePolyfills(),
      ts(),
      resolve()
    ]
  },

  {
    input,
    external,
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      ts(),
      resolve({ preferBuiltins: true })
    ]
  },

  {
    input,
    external,
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    },
    plugins: [
      ts({ tsconfig: resolvedConfig => ({ ...resolvedConfig, declaration: true }) }),
      resolve({ preferBuiltins: true })
    ]
  }
]
