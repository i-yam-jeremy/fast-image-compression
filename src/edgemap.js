/*
  Writes the given edge map to the given
  output bitstream

  @param out - BitOutputStream - the output bitstream
  @param edgeMap - Boolean[][] - the edge map 2D-array
  @param width - Unsigned Integer (32-bit) - the width of the image
                                              (also, width of edge map)
  @param height - Unsigned Integer (32-bit) - the height of the image
                                              (also, height of edge map)

  Side Effects:
    - increases the bit position of 'out', the output bitstream
*/
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

/*
  Reads in an edge map (indexed by edgeMap[y][x]), with
  the specified width and height, from the given input bitstream

  @param input - BitInputStream - the input bitstream (source)
  @param width - Unsigned Integer (32-bit) - the image width
                                              (also, the edge map width)
  @param height - Unsigned Integer (32-bit) - the image height
                                              (also, the edge map height)
  @return - Boolean[][] - a 2D-array representing which pixels are
                            on edges, if edgeMap[y][x] is true, it
                            means the pixel at (y, x) is on an edge

  Side Effects:
    - increases the bit position of 'input', the input bitstream
*/
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

/*
  Returns true iff the given delta will not
  be able to be stored within 7-bits, meaning
  it will take at least 8-bits to store, and
  at that point it is as good or better to just
  use the original byte value instead of the
  delta

  @param delta - Integer - the delta between two values
  @return - Boolean - true iff the given delta is large,
                      false otherwise

  Side Effects:
    None
*/
function isLargeDelta(delta) {
  return (delta < -8 || delta > 10)
}

/*
  Finds the edges (pixels with large deltas)
  for the given image and returns the result
  as a 2D-array (indexed by edgeMap[y][x]) where
  edgeMap[y][x] is true iff the pixel at (x, y)
  in the given image is on an edge, and false
  otherwise

  @param image - Jimp - the input image
  @return - Boolean[][] - the 2D-array edge map

  Side Effects:
    None
*/
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

module.exports = {
  writeEdgeMap,
  readEdgeMap,
  findEdges
}
