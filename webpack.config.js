const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SourceMapPlugin = require('webpack').SourceMapDevToolPlugin;

const issuer = m => {
  return (m.issuer ? issuer(m.issuer) : (m.name ? m.name : false));
};

module.exports = (env, argv) => {
  env = env || {};
  let plugins = [
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),

  ];
  if (!env.production) {
    plugins.push(new SourceMapPlugin({
      test: /\.s?css$/
    }));
  }
  return {
    node: {
      __dirname: true,
      __filename: true
    },
    entry: {
      'main': ['@babel/polyfill/noConflict', './test/main.js']
    },
    output: {
      path: path.resolve(__dirname, 'test', 'dist'),
      filename: "[name].js"
    },
    mode: env.production ? 'production' : 'development',
    resolve: {
      modules: [
        path.resolve(__dirname, 'node_modules')
      ],
      alias: {
        'scss-settings': path.resolve(__dirname, 'util')
      }
    },
    plugins: plugins,
    module: {
      rules: [
        {
          test: /\.js$/,
          use: 'babel-loader',
          exclude: /node_modules/
        },
        {
          test: /\.s?css$/,
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: {url: false, sourceMap: !env.production}},
            {
              loader: 'sass-loader',
              options: {
                sourceMap: !env.production
              }
            }
          ]
        }
      ]
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          css: {
            name: 'main',
            test: (m,c,entry = 'main') => m.constructor.name === 'CssModule' && issuer(m) === entry,
            chunks: 'all',
            enforce: true
          }
        }
      }
    },
    devServer: {
      liveReload: true,
      index: 'index.html',
      open: true,
      publicPath: '/dist/',
      contentBase: path.join(__dirname, 'test')
    }
  }
};