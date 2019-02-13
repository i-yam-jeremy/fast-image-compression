const compressLib = require('./compress')
const compress = compressLib.compress
const decompress = compressLib.decompress

module.exports = {
  compress,
  decompress
}

const fs = require('fs')
fs.readFile('tree.png', (err, data) => {
  if (err) throw err
  compress(data)
    .then(compressedData => {
      fs.writeFile('tree.fic', compressedData, 'binary', err => {
        if (err) throw err

        fs.readFile('tree.fic', (err, compressedData) => {
          if (err) throw err
          console.log(compressedData.length)
          decompress(compressedData)
            .then(data => {
              fs.writeFile('tree-output.png', data, 'binary', err => {
                if (err) throw err
              })
            })
            .catch(err => {
              console.error(err)
            })
        })
      })
    })
    .catch(err => {
      console.error(err)
    })
})
