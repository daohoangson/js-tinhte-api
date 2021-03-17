const StatsWebpackPlugin = require('stats-webpack-plugin')

const config = {
  devServer: {
    disableHostCheck: true
  },
  karma: {
    extra: {
      browserDisconnectTolerance: 4,
      browserNoActivityTimeout: 30000,
      client: {
        mocha: {
          timeout: 50000
        }
      }
    }
  },
  npm: {
    umd: {
      global: 'TinhteApiReact',
      externals: {
        react: 'React'
      }
    }
  },
  webpack: {
    extra: {
      plugins: [
        new StatsWebpackPlugin('stats.json', { chunkModules: true })
      ]
    }
  }
}

module.exports = config
