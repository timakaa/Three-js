// webpack.config.js
const path = require("path");

module.exports = {
  mode: "development",
  devServer: {
    static: [
      {
        directory: path.join(__dirname, "dist"),
        publicPath: "/",
      },
      {
        directory: path.join(__dirname, "public"),
        publicPath: "/",
      },
    ],
    compress: true,
    port: 3000,
    allowedHosts: "all",
    host: "0.0.0.0",
    open: true,
    hot: true,
    client: {
      overlay: false,
    },
    watchFiles: ["src/**/*", "public/**/*"],
  },
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
  },
};
