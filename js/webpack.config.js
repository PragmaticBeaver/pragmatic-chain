const path = require("path");

module.exports = {
  target: "node",
  devtool: "inline-source-map",
  entry: { index: "./src/index.ts" },

  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "pragmatic-core.js", // <--- Will be compiled to this single file
    library: "PragmaticCore",
    libraryTarget: "umd",
    umdNamedDefine: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader?configFile=tsconfig.webpack.json",
        exclude: /node_modules/,
      },
    ],
  },
};
