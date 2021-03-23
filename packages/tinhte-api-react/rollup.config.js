import nodePolyfills from 'rollup-plugin-node-polyfills'
import resolve from '@rollup/plugin-node-resolve'
import ts from 'rollup-plugin-ts'
import pkg from './package.json'

const input = 'src/index.ts'
const external = [
  ...Object.keys(pkg.peerDependencies),
  ...Object.keys(pkg.dependencies)
]

export default [
  {
    input,
    external: Object.keys(pkg.peerDependencies),
    output: {
      name: 'TinhteApiReact',
      file: pkg.browser,
      format: 'umd',
      globals: {
        react: 'React'
      },
      sourcemap: true
    },
    plugins: [
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
      ts({ tsconfig: { declaration: true } }),
      resolve({ preferBuiltins: true })
    ]
  }
]
