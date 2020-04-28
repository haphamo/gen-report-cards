const fs              = require('fs');
const csv             = require('csv-parser')
const args            = process.argv.slice(2)

// create a function that goes through the argv args and create read stream for the data

const createReadStreamData = function(dataFile) {
  fs.createReadStream(`./data/${dataFile}`)
  .pipe(csv())
  .on('data', (data) => console.log(data))
}

const allData = args.forEach(createReadStreamData)


// NTS--------------
// fs.createReadStream: It will read the file in chunks of the size which is specified before hand
// fs.readFile: It will read the file completely into memory before making it available for the user


