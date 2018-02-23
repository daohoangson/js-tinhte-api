module.exports = {
  type: 'react-component',
  npm: {
    esModules: true,
    umd: {
      global: 'TinhteApiReact',
      externals: {
        react: 'React'
      }
    }
  }
}
