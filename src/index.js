const compressLib = require('./compress')
const compress = compressLib.compress
const decompress = compressLib.decompress

module.exports = {
  compress,
  decompress
}
