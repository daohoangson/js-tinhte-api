const StatsWebpackPlugin = require('stats-webpack-plugin')

const config = {
  babel: {
    runtime: true
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
