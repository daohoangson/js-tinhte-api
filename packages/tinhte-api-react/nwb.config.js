const StatsWebpackPlugin = require('stats-webpack-plugin')

const config = {
  babel: {
    runtime: true
  },
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
    html: {
      filename: 'index.html'
    },
    extra: {
      plugins: [
        new StatsWebpackPlugin('stats.json', { chunkModules: true })
      ]
    }
  }
}

if (process.env.NODE_ENV === 'production') {
  // https://gist.github.com/insin/2b0db9f9fe3922ca57ccda54d8166aba
  config.webpack.html.filename = '200.html'
}

module.exports = config
