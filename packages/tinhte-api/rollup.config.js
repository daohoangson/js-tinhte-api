import nodePolyfills from 'rollup-plugin-node-polyfills'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

export default [
  {
    input: 'src/index.ts',
    output: {
      name: 'TinhteApi',
      file: pkg.browser,
      format: 'umd',
      sourcemap: true
    },
    plugins: [
      nodePolyfills(),
      typescript(),
      resolve()
    ]
  },

  {
    input: 'src/index.ts',
    external: Object.keys(pkg.dependencies),
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: [
      typescript(),
      resolve({
        preferBuiltins: true
      })
    ]
  }
]
