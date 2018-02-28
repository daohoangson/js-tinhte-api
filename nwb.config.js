const config = {
  type: 'react-component',
  babel: {
    runtime: true
  },
  npm: {
    esModules: true,
    umd: {
      global: 'TinhteApi',
      externals: {
        react: 'React'
      }
    }
  },
  webpack: {
    html: {
      filename: 'index.html'
    }
  }
}

if (process.env.NODE_ENV === 'production') {
  // https://gist.github.com/insin/2b0db9f9fe3922ca57ccda54d8166aba
  config.webpack.html.filename = '200.html'
}

module.exports = config
