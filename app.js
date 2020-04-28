const fs              = require('fs');
const csv             = require('csv-parser')
const args            = process.argv.slice(2)

const coursesFilePath = './data/courses.csv'


console.log('args', args)


// It will read the file in chunks of the size which is specified before hand
fs.createReadStream(`./data/${args[0]}`)
  .pipe(csv())
  .on('data', (data) => console.log(data))
  .on('end', () => {
    console.log('End')
  });

// It will read the file completely into memory before making it available for the user
// fs.readFile(`./data/${args[0]}`, 'utf8', function (err, data) {
//   console.log('data: ', data)
// })

