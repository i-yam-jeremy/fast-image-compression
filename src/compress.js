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
function compress(inputImageData) {
  return new Promise((resolve, reject) => {
    Jimp.read(inputImageData)
      .then(image => {
        let out = new BitOutputStream()
        writeHeader(out, image.bitmap.width, image.bitmap.height)
        let edgeMap = findEdges(image)
        writeEdgeMap(out, edgeMap, image.bitmap.width, image.bitmap.height)
        writeBody(out, edgeMap, image)
        resolve(out.bytes())
      })
      .catch(err => {
        reject(err)
      })
  })
}

/*
  TODO FIXME change so it takes a Uint8Array (or bytes) as input
  and returns another Uint8Array as a result so can be used without files
*/
function decompress(inputData) {
  return new Promise((resolve, reject) => {
    let input = new BitInputStream(inputData)
    let header = readHeader(input)
    let edgeMap = readEdgeMap(input, header.width, header.height)
    new Jimp(header.width, header.height, (err, image) => {
      if (err) {
        reject(err)
        return
      }
      readBody(input, edgeMap, image)
      image.getBufferAsync('image/png')
        .then(buffer => {
          resolve(buffer)
        })
        .catch(err => {
          reject(err)
        })
    })
  })
}

module.exports = {
  compress,
  decompress
}
