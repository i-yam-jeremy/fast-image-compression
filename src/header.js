/**
 The 4 bytes at the start of the file, used to
 indicate that the file is a FIC (Fast Image Compression)
 file
*/
const HEADER_MAGIC_NUMBER = 0x00464943

/**
  Writes the file header with specified width and
  height to the given output bitstream

  <p>Side Effects:</p>
    <p>- increases the bit position of 'out', the output bitstream</p>

  @param {BitOutputStream} out the output bitstream (destination)
  @param {Integer} width the image width (unsigned 32-bit integer)
  @param {Integer} height - the image height (unsigned 32-bit integer)
*/
function writeHeader(out, width, height) {
  out.write(HEADER_MAGIC_NUMBER, 32)
  out.write(width, 32)
  out.write(height, 32)
}

/**
  Reads and validates the header data from a given input bistream.
  Returns false iff the header is invalid, otherwise returns and
  object containing the image width and height

  <p>Side Effects:</p>
    <p>- increases the bit position of 'input', the input bitstream</p>

  @param {BitInputStream} input the input bitstream (source)
  @return {Boolean|Object} {width: Integer, height: Integer} if
                              the magic number is valid, otherwise
                              false
*/
function readHeader(input) {
  let magicNumber = input.read(32)
  if (magicNumber != HEADER_MAGIC_NUMBER) {
    return false;
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

module.exports = {
  writeHeader,
  readHeader
}
