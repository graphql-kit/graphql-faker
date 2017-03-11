const webpack = require('webpack');
const path = require('path');

function root(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [__dirname].concat(args));
}

module.exports = {
  devtool: 'cheap-source-map',

  performance: {
    hints: false
  },
  devServer: {
    contentBase: root('.'),
    watchContentBase: true,
    port: 9090,
    stats: 'errors-only',
    proxy: {
      '/user-idl': 'http://localhost:9002'
    }
  },
  resolve: {
    extensions: ['.jsx', '.js', '.json']
  },
  entry: ['./index.jsx'],
  output: {
    path: root('.'),
    filename: 'main.js',
    sourceMapFilename: '[file].map'
  },
  module: {
    rules: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['es2015', 'react'],
          plugins: [
            'transform-class-properties'
          ]
        }
      }
    ]
  },

  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    })
  ]
}
