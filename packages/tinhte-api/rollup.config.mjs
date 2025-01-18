import commonjs from '@rollup/plugin-commonjs'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import pkg from './package.json' assert { type: 'json' }

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
      typescript(),
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
      typescript(),
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
      typescript(),
      resolve({ preferBuiltins: true })
    ]
  }
]
