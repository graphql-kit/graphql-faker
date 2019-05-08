const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
function root(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [__dirname].concat(args));
}

module.exports = {
  devtool: 'cheap-source-map',

  performance: {
    hints: false,
  },
  devServer: {
    contentBase: root('.'),
    watchContentBase: true,
    port: 9090,
    stats: 'errors-only',
    proxy: {
      '/user-sdl': 'http://localhost:9002',
      '/graphql': 'http://localhost:9002',
    },
  },
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', 'ts', '.json'],
  },
  entry: ['./index.tsx'],
  output: {
    path: root('.'),
    filename: 'main.js',
    sourceMapFilename: '[file].map',
  },
  module: {
    rules: [
      {
        test: /.[jt]sx?$/,
        loader: 'awesome-typescript-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
                minimize: true,
              },
            },
            'postcss-loader?sourceMap',
          ],
        }),
      },
    ],
  },

  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }),
    new ExtractTextPlugin({
      filename: 'main.css',
      allChunks: true,
    }),
    // Workaround for https://github.com/graphql/graphql-language-service/issues/128
    new webpack.IgnorePlugin(/\.js\.flow$/, /graphql-language-service-interface[\\/]dist$/)
  ],
};
