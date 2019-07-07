var path = require('path');
var webpack = require('webpack');
var VueLoaderPlugin = require("vue-loader/lib/plugin");

module.exports = {
  entry: "./src/main.ts",
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'app.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        loader: 'ts-loader',
        exclude: [ /node_modules/, /\.vue.ts$/ ],
        options: {
          appendTsSuffixTo: [/\.vue$/],
        }
      },
      { test: /\.vue$/, loader: 'vue-loader' },
      {
        test: /\.vue\.ts$/,
        loader: 'vue-loader',
        options: {
          compiler: require("../../dist/index"),
          loaders: {
            // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
            // the "scss" and "sass" values for the lang attribute to the right configs here.
            // other preprocessors should work out of the box, no loader config like this necessary.
            'scss': 'vue-style-loader!css-loader!sass-loader',
            'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
          }
          // other vue-loader options go here
        }
      },
      {
        test: /\.(css|scss)$/,
        use: [
          "vue-style-loader",
          "css-loader",
        ],
      },
      {
        test: /\.(png|jpg|gif|svg|ttf|woff|eot)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]',
        }
      }
    ]
  },
  mode: "development",
  resolve: {
    extensions: ['.ts', '.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    }
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  performance: {
    hints: false,
  },
  plugins: [
    new VueLoaderPlugin()
  ],
  devtool: '#eval-source-map',
  target: "electron-renderer",
};



if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map';
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ]);
}