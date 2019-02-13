/**
  Writes out a delta (difference between two values) to
  the given output bitstream in a form that uses shorter
  prefix-free codes for smaller delta values and larger
  codes for larger deltas

  @param out - BitOutputStream - the output bitstream (destination)
  @param oldValue - Integer - the old value (initial value)
  @param newValue - Integer - the new value (final value)

  Note: delta = newValue - oldValue

  Side Effects:
    - increases the bit position of 'out', the output bitstream
*/
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

/**
  Reads in a delta (difference between two values) to
  the given output bitstream in a form that uses shorter
  prefix-free codes for smaller delta values and larger
  codes for larger deltas

  @param input - BitInputStream - the input bitstream (source)
  @return - Integer - the delta represented by the bits read

  Side Effects:
    - increases the bit position of 'input', the input bitstream
*/
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

module.exports = {
  writeDelta,
  readDelta
}
