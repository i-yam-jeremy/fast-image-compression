const deltaLib = require('./delta')
const writeDelta = deltaLib.writeDelta
const readDelta = deltaLib.readDelta


/*
  Writes the image pixel data (body of the file) to
  the given output bitstream using FIC delta compression.
  That is, it writes out data for each pixel in the input
  image. If the pixel is on an edge as defined by 'edgeMap',
  it will write the raw RGB (8-bits per channel) form. If
  the pixel is not on an edge, it will use the deltas from
  either the pixel to the left of the pixel above to store
  the pixel data.

  @param out - BitOutputStream - the output bitstream (destination)
  @param edgeMap - Boolean[][] - a 2D-array (indexed by edgeMap[y][x])
                                 where the value is true if the pixel
                                 at (x, y) is on an edge and false
                                 otherwise
  @param image - Jimp - the image to compress

  Side Effects:
    - increases the bit position of 'out', the output bitstream
*/
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

/*
  Reads the image pixel data (body of the file) from the
  given input bitstream using the given edgeMap, and stores
  the pixels read into the given image

  @param input - BitInputStream - the input bitstream (source)
  @param edgemap - Boolean[][] - a 2D-array representing which pixels are
                                  on edges, if edgeMap[y][x] is true, it
                                  means the pixel at (y, x) is on an edge
  @param image - Jimp - the destination for writing the pixel data

  Side Effects:
    - increases the bit position of 'input', the input bitstream
    - overwrites pixel data in 'image' with data that was read and
        decompressed from the input bitstream
*/
function readBody(input, edgeMap, image) {
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

module.exports = {
  writeBody,
  readBody
}
