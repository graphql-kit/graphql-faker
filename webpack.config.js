const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  // mode: 'development',
  // devtool: 'inline-source-map',
  devServer: {
    contentBase: './src/editor',
    proxy: {
      '/graphql': 'http://localhost:9002',
      '/user-sdl': 'http://localhost:9002',
      '/voyager.worker.js': 'http://localhost:9002',
    },
  },
  entry: './src/editor/index.tsx',
  plugins: [new MiniCssExtractPlugin({ filename: 'main.css' })],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { importLoaders: 1 } },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.mjs', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'src/editor'),
  },
};
