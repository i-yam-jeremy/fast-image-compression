const bitstream = require('@thi.ng/bitstream')
const BitInputStream = bitstream.BitInputStream
const BitOutputStream = bitstream.BitOutputStream


function writeHeader(out, width, height) {
  out.write(0x00464943, 32) // Magic Number
  out.write(width, 32)
  out.write(height, 32)
}

function writeDelta(out, oldValue, newValue) {
  let delta = newValue - oldValue;
  if (delta < 0) {
    out.write(1, 1)
  }
  else {
    out.write(0, 1)
  }
  deltaMagnitude = Math.abs(delta)

  let deltaBitCount = Math.ceil(Math.log2(deltaMagnitude)) + 1
  let deltaBitCountBitCount = Math.ceil(Math.log2(deltaBitCount)) + 1

  for (let i = 0; i < deltaBitCountBitCount; i++) {
    out.write(1, 1) // there are more bits
    let bitPos = deltaBitCountBitCount - i - 1;
    out.write((deltaBitCount >> bitPos) & 0x1, 1)
  }
  out.write(0, 1) // there are no more bits in bit count

  for (let i = 0; i < deltaBitCount; i++) {
    let bitPos = deltaBitCount - i - 1;
    out.write((deltaMagnitude >> bitPos) & 0x1, 1)
  }
}

function readDelta(input) {
  let isNegative = input.read(1) == 1

  let bitCount = 0
  while (input.read(1) == 1) {
    bitCount = (bitCount << 1) | input.read(1)
  }

  let deltaMagnitude = 0
  for (let i = 0; i < bitCount; i++) {
    deltaMagnitude = (deltaMagnitude << 1) | input.read(1)
  }

  return isNegative ? -deltaMagnitude : deltaMagnitude
}

function writeBody(out, pixelData, width, height) {

}

let out = new BitOutputStream()
writeDelta(out, 100, 108)

let input = new BitInputStream(out.bytes())
let delta = readDelta(input)
console.log(delta)
