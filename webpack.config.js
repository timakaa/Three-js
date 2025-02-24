// webpack.config.js
const path = require("path");

module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  devServer: {
    static: [
      {
        directory: path.join(__dirname, "dist"),
        publicPath: "/",
      },
      {
        directory: path.join(__dirname, "src"),
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
    watchFiles: ["src/**/*"],
  },
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
  },
  plugins: [
    new (require("copy-webpack-plugin"))({
      patterns: [
        {
          from: "src/index.html",
          to: "index.html",
        },
        {
          from: "src/index.css",
          to: "index.css",
        },
        {
          from: "src/assets",
          to: "assets",
        },
      ],
    }),
  ],
};
