const StatsWebpackPlugin = require('stats-webpack-plugin')

const config = {
  babel: {
    runtime: true
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
      global: 'TinhteApi'
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
