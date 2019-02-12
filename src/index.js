const bitstream = require('@thi.ng/bitstream')
const BitInputStream = bitstream.BitInputStream
const BitOutputStream = bitstream.BitOutputStream


function writeHeader(out, width, height) {
  out.write(0x00464943, 32) // Magic Number
  out.write(width, 32)
  out.write(height, 32)
}

function writeDelta(out, oldValue, newValue) {
  let delta = newValue - oldValue
  let isNegative = (delta <= 0) // The "<=" is intentional, zero is counted as negative in this model

  let index = Math.abs(Math.floor((delta + (isNegative ? 0 : -1)) / 2))
  for (let i = 0; i < index; i++) {
    out.write(1, 1)
    console.log(1)
  }
  out.write(0, 1)
  console.log(0)

  out.write(isNegative ? 1 : 0, 1)
  console.log(isNegative ? 1 : 0)

  let offset = Math.abs((delta + (isNegative ? 0 : -1)) % 2)
  out.write(offset, 1)
  console.log(offset)
}

function readDelta(input) {
  let index = 0
  while (input.read(1) == 1) {
    console.log(1)
    index++
  }
  console.log(0)

  let isNegative = (input.read(1) == 1)
  console.log(isNegative ? 1 : 0)
  let offset = input.read(1)
  console.log(offset)

  let baseMagnitude = 2*index

  if (isNegative) {
    return -baseMagnitude + offset
  }
  else {
    return baseMagnitude+1 + offset
  }
}

function writeBody(out, pixelData, width, height) {

}

let out = new BitOutputStream()
writeDelta(out, 100, 100)

let input = new BitInputStream(out.bytes())
let delta = readDelta(input)
