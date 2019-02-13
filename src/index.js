const bitstream = require('@thi.ng/bitstream')
const BitInputStream = bitstream.BitInputStream
const BitOutputStream = bitstream.BitOutputStream
const Jimp = require('jimp')
const fs = require('fs')

const HEADER_MAGIC_NUMBER = 0x00464943

function writeHeader(out, width, height) {
  out.write(HEADER_MAGIC_NUMBER, 32)
  out.write(width, 32)
  out.write(height, 32)
}

function writeDelta(out, oldValue, newValue) {
  let delta = newValue - oldValue
  let isNegative = (delta <= 0) // The "<=" is intentional, zero is counted as negative in image model

  let index = Math.abs(Math.floor((delta + (isNegative ? 0 : -1)) / 2))
  for (let i = 0; i < index; i++) {
    out.write(1, 1)
  }
  out.write(0, 1)

  out.write(isNegative ? 1 : 0, 1)

  let offset = Math.abs((delta + (isNegative ? 0 : -1)) % 2)
  out.write(offset, 1)
}

function readDelta(input) {
  let index = 0
  while (input.read(1) == 1) {
    index++
  }

  let isNegative = (input.read(1) == 1)
  let offset = input.read(1)

  let baseMagnitude = 2*index

  if (isNegative) {
    return -baseMagnitude + offset
  }
  else {
    return baseMagnitude+1 + offset
  }
}

function writeBody(out, edgeMap, image) {
  for (let y = 0; y < image.bitmap.height; y++) {
    for (let x = 0; x < image.bitmap.width; x++) {
      let index = 4*(y*image.bitmap.width + x)
      let r = image.bitmap.data[index+0]
      let g = image.bitmap.data[index+1]
      let b = image.bitmap.data[index+2]
      let rX = image.bitmap.data[index+0 - 4]
      let gX = image.bitmap.data[index+1 - 4]
      let bX = image.bitmap.data[index+2 - 4]
      let rY = image.bitmap.data[index+0 - 4*image.bitmap.width]
      let gY = image.bitmap.data[index+1 - 4*image.bitmap.width]
      let bY = image.bitmap.data[index+2 - 4*image.bitmap.width]
      if (edgeMap[y][x] || (x == 0 && y == 0)) {
        // just write normal non-delta byte values for RGB
        out.write(r, 8)
        out.write(g, 8)
        out.write(b, 8)
      }
      else {
        if (x == 0) {
          out.write(1, 1) // use Y (delta is from pixel above)
          writeDelta(out, rY, r)
          writeDelta(out, gY, g)
          writeDelta(out, bY, b)
        }
        else if (y == 0) {
          out.write(0, 1) // use X (delta is from pixel above)
          writeDelta(out, rX, r)
          writeDelta(out, gX, g)
          writeDelta(out, bX, b)
        }
        else {
          let totalDeltaXMagnitude =
                r - rX +
                g - gX +
                b - bX
          let totalDeltaYMagnitude =
                r - rY +
                g - gY +
                b - bY

          if (totalDeltaYMagnitude < totalDeltaXMagnitude) {
            out.write(1, 1) // use Y (delta is from pixel above)
            writeDelta(out, rY, r)
            writeDelta(out, gY, g)
            writeDelta(out, bY, b)
          }
          else {
            out.write(0, 1) // use X (delta is from pixel to left)
            writeDelta(out, rX, r)
            writeDelta(out, gX, g)
            writeDelta(out, bX, b)
          }
        }
      }
    }
  }
}

function isLargeDelta(delta) {
  return (delta < -8 || delta > 10)
}

function findEdges(image) {
  let edgeMap = []
  for (let y = 0; y < image.bitmap.height; y++) {
    edgeMap.push([])
    for (let x = 0; x < image.bitmap.width; x++) {
      let index = 4*(y*image.bitmap.width + x)
      let r = image.bitmap.data[index+0]
      let g = image.bitmap.data[index+1]
      let b = image.bitmap.data[index+2]
      let rX = image.bitmap.data[index+0 - 4]
      let gX = image.bitmap.data[index+1 - 4]
      let bX = image.bitmap.data[index+2 - 4]
      let rY = image.bitmap.data[index+0 - 4*image.bitmap.width]
      let gY = image.bitmap.data[index+1 - 4*image.bitmap.width]
      let bY = image.bitmap.data[index+2 - 4*image.bitmap.width]
      if (x == 0 && y == 0) {
        edgeMap[y].push(true)
      }
      else {
        if (x == 0) {
          // use Y (delta is from pixel above)
          edgeMap[y].push(
            isLargeDelta(r-rY) ||
            isLargeDelta(g-gY) ||
            isLargeDelta(b-bY))
        }
        else if (y == 0) {
          // use X (delta is from pixel to left)
          edgeMap[y].push(
            isLargeDelta(r-rX) ||
            isLargeDelta(g-gX) ||
            isLargeDelta(b-bX))
        }
        else {
          let totalDeltaXMagnitude =
                r - rX +
                g - gX +
                b - bX
          let totalDeltaYMagnitude =
                r - rY +
                g - gY +
                b - bY

          if (totalDeltaYMagnitude < totalDeltaXMagnitude) {
            edgeMap[y].push(
              isLargeDelta(r-rY) ||
              isLargeDelta(g-gY) ||
              isLargeDelta(b-bY))
          }
          else {
            // use X (delta is from pixel to left)
            edgeMap[y].push(
              isLargeDelta(r-rX) ||
              isLargeDelta(g-gX) ||
              isLargeDelta(b-bX))
          }
        }
      }
    }
  }
  return edgeMap
}

function writeEdgeMap(out, edgeMap, width, height) {
  let trues = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      out.write(edgeMap[y][x] ? 1 : 0, 1)
      if (edgeMap[y][x]) {
        trues++
      }
    }
  }
  console.log("Edge Proportion: " + (trues / (width*height)))
}

function renderEdgeMap(edgeMap, width, height, outputPath) {
  new Jimp(width, height, (err, image) => {
    if (err) throw err
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (edgeMap[y][x]) {
          image.bitmap.data[4*(y*width + x) + 0] = 0xFF
          image.bitmap.data[4*(y*width + x) + 1] = 0xFF
          image.bitmap.data[4*(y*width + x) + 2] = 0xFF
          image.bitmap.data[4*(y*width + x) + 3] = 0xFF
        }
        else {
          image.bitmap.data[4*(y*width + x) + 0] = 0
          image.bitmap.data[4*(y*width + x) + 1] = 0
          image.bitmap.data[4*(y*width + x) + 2] = 0
          image.bitmap.data[4*(y*width + x) + 3] = 0x00
        }
      }
    }
    image.write(outputPath + '-edges.png')
  })
}

function compressImage(imagePath, outputPath) {
  Jimp.read(imagePath)
    .then(image => {
      let out = new BitOutputStream()
      writeHeader(out, image.bitmap.width, image.bitmap.height)
      let edgeMap = findEdges(image)
      renderEdgeMap(edgeMap, image.bitmap.width, image.bitmap.height, outputPath)
      writeEdgeMap(out, edgeMap, image.bitmap.width, image.bitmap.height)
      writeBody(out, edgeMap, image)
      fs.writeFile(outputPath, out.bytes(), 'binary', (err) => {
        if (err) throw err
      })
    })
    .catch(err => {
      throw err
    })
}

function readHeader(input) {
  let magicNumber = input.read(32)
  if (magicNumber != HEADER_MAGIC_NUMBER) {
    return null;
  }
  else {
    let width = input.read(32)
    let height = input.read(32)
    return {
      width: width,
      height: height
    }
  }
}

function readEdgeMap(input, width, height) {
  let edgeMap = []
  for (let y = 0; y < height; y++) {
    edgeMap.push([])
    for (let x = 0; x < width; x++) {
      let bit = input.read(1)
      edgeMap[y].push(bit == 1)
    }
  }

  return edgeMap
}

function readPixelData(input, edgeMap, image) {
  for (let y = 0; y < image.bitmap.height; y++) {
    for (let x = 0; x < image.bitmap.width; x++) {
      let index = 4*(y*image.bitmap.width + x)
      let rX = image.bitmap.data[index+0 - 4]
      let gX = image.bitmap.data[index+1 - 4]
      let bX = image.bitmap.data[index+2 - 4]
      let rY = image.bitmap.data[index+0 - 4*image.bitmap.width]
      let gY = image.bitmap.data[index+1 - 4*image.bitmap.width]
      let bY = image.bitmap.data[index+2 - 4*image.bitmap.width]
      let r=0, g=0, b=0
      if (edgeMap[y][x] || (x == 0 && y == 0)) {
        // just read normal non-delta byte values for RGB
        r = input.read(8)
        g = input.read(8)
        b = input.read(8)
      }
      else {
        let useY = (input.read(1) == 1)
        let dR = readDelta(input)
        let dG = readDelta(input)
        let dB = readDelta(input)
        if (useY) {
          r = rY + dR
          g = gY + dG
          b = bY + dB
        }
        else {
          r = rX + dR
          g = gX + dG
          b = bX + dB
        }
      }

      image.bitmap.data[index + 0] = r
      image.bitmap.data[index + 1] = g
      image.bitmap.data[index + 2] = b
      image.bitmap.data[index + 3] = 0xFF
    }
  }
}

function decompressImage(inputPath, outputImagePath) {
  fs.readFile(inputPath, (err, data) => {
    if (err) throw err
    let input = new BitInputStream(data)
    let header = readHeader(input)
    let edgeMap = readEdgeMap(input, header.width, header.height)
    new Jimp(header.width, header.height, (err, image) => {
      if (err) throw err
      readPixelData(input, edgeMap, image)
      image.write(outputImagePath)
    })
  })
}

decompressImage('tree.fic', 'tree-output.png')
