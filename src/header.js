/*
 The 4 bytes at the start of the file, used to
 indicate that the file is a FIC (Fast Image Compression)
 file
*/
const HEADER_MAGIC_NUMBER = 0x00464943

/*
  Writes the file header with specified width and
  height to the given output bitstream

  @param out - BitOutputStream - the output bitstream (destination)
  @param width - Unsigned Integer (32-bit) - the image width
  @param width - Unsigned Integer (32-bit) - the image height

  Side Effects:
    - increases the bit position of 'out', the output bitstream
*/
function writeHeader(out, width, height) {
  out.write(HEADER_MAGIC_NUMBER, 32)
  out.write(width, 32)
  out.write(height, 32)
}

/*
  Reads and validates the header data from a given input bistream.
  Returns false iff the header is invalid, otherwise returns and
  object containing the image width and height

  @param input - BitInputStream - the input bitstream (source)
  @return - Boolean|Object - {width: Integer, height: Integer} if
                              the magic number is valid, otherwise
                              false

  Side Effects:
    - increases the bit position of 'input', the input bitstream
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
