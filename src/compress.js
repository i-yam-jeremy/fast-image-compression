const bitstream = require('@thi.ng/bitstream')
const BitInputStream = bitstream.BitInputStream
const BitOutputStream = bitstream.BitOutputStream
const Jimp = require('jimp')
const fs = require('fs')

const writeHeader = require('./header').writeHeader
const readHeader = require('./header').readHeader

const edgemap = require('./edgemap')
const writeEdgeMap = edgemap.writeEdgeMap
const readEdgeMap = edgemap.readEdgeMap
const findEdges = edgemap.findEdges

const body = require('./body')
const writeBody = body.writeBody
const readBody = body.readBody

/*
  TODO FIXME change so it takes a Uint8Array (or bytes) as input
  and returns another Uint8Array as a result so can be used without files
*/
function compress(imagePath, outputPath) {
  Jimp.read(imagePath)
    .then(image => {
      let out = new BitOutputStream()
      writeHeader(out, image.bitmap.width, image.bitmap.height)
      let edgeMap = findEdges(image)
      writeEdgeMap(out, edgeMap, image.bitmap.width, image.bitmap.height)
      writeBody(out, edgeMap, image)
      fs.writeFile(outputPath, out.bytes(), 'binary', (err) => {
        if (err) throw err
      })
    })
    .catch(err => {
      console.error(err)
    })
}

/*
  TODO FIXME change so it takes a Uint8Array (or bytes) as input
  and returns another Uint8Array as a result so can be used without files
*/
function decompress(inputPath, outputImagePath) {
  fs.readFile(inputPath, (err, data) => {
    if (err) throw err
    let input = new BitInputStream(data)
    let header = readHeader(input)
    let edgeMap = readEdgeMap(input, header.width, header.height)
    new Jimp(header.width, header.height, (err, image) => {
      if (err) throw err
      readBody(input, edgeMap, image)
      image.write(outputImagePath)
    })
  })
}

module.exports = {
  compress,
  decompress
}
