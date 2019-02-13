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
  Compresses the given input image data using FIC (Fast Image Compression)

  @param inputImageData - Uint8Array - the input image buffer
                                        (can be bytes for JPEG, GIF, PNG, BMP, TIFF, or GIF)
  @return - Promise(Uint8Array) - a promise for the compressed data buffer
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
  Compresses the given input image data using FIC (Fast Image Compression)

  @param inputData - Uint8Array - the image data compressed in FIC format
  @param outputFormat - String - the output image format
                                  (one of 'jpeg', 'png', 'bmp', 'tiff', 'gif')
  @return - Promise(Uint8Array) - a promise for the decompressed data buffer in PNG format
*/
function decompress(inputData, outputFormat) {
  outputFormat = outputFormat || 'png'
  let outputMimeType = 'image/' + outputFormat
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
      image.getBufferAsync(outputMimeType)
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
