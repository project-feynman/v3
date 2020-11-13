const path = require("path");

module.exports = {
  // to combat the Webpack 4.0 error (see https://stackoverflow.com/questions/57916549/vue-cli-run-build-typeerror-name-undefined)
  css: {
    sourceMap: true
  },
  // change these to output to different build targets
  outputDir: path.resolve(__dirname, "dist/stable")
}