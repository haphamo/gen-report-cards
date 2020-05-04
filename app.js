const fs              = require('fs');
const fsp             = require('fs').promises;
const csv             = require('csv-parser');
const neatCsv         = require('neat-csv');
const args            = process.argv.slice(2);

// final JSON
let result = {
  students: [],
  marks: []
}

// console.log(args) // => [ 'courses.csv', 'students.csv', 'tests.csv', 'marks.csv', output.json ]

async function writeDataToOutput() {
  try {

    fs.createReadStream(`./data/${args[0]}`)
    .pipe(csv())
    .on('data', (row) => {
      result.students.push({id: parseInt(row.id), name: row.name, totalAverage: 0, courses: []});

      result.students.sort(function(a, b) { 
            return a.id - b.id;
          });
    })
    .on('end', () => {
        fs.createWriteStream('data/output.json', 'utf8')
        .write(JSON.stringify(result));
    })
  }
  catch (err) {
    console.error("Error!")
  }
}

async function readMarks() {
  try {
    fs.createReadStream(`./data/${args[1]}`)
    .pipe(csv())
    .on('data', (row) => {
      // console.log(Object.keys(row)[0])
      
      result.marks.push({test_id: parseInt(row.test_id), student_id: parseInt(row.student_id), mark: parseInt(row.mark)})

      // console.log(`${Object.keys(row)[1]}`)
    })
    .on('end', () => {
      console.log(result)
      
    })
  }
  catch(err) {
    console.error(err)
  }
}
// create 2 more functions to add course and  test data

writeDataToOutput()
readMarks()




// fs.createReadStream(`./data/${args[0]}`)
//   .pipe(csv())

// streamReadStudents.on('data', (row) => {

//     // set up data structure for students, parsed SID to a number
//     result.students.push({id: parseInt(row.id), name: row.name, totalAverage: 0, courses: []})

 
// })

// streamReadStudents.on('end', () => {
//   // sorts the students by id
//   result.students.sort(function(a, b) { 
//     return a.id - b.id;
//   });
//   // path is the last arguement
//   fs.createWriteStream('data/output.json', 'utf8')
//   .write(JSON.stringify(result))
// })



// NTS--------------
// JSON result is an obj with a students key (arr)
// students.csv has a similar to the final result
// use map to generate the students arr
// node app.js courses.csv students.csv tests.csv marks.csv output.json
// fs.createReadStream: It will read the file in chunks of the size which is specified before hand
// fs.readFile: It will read the file completely into memory before making it available for the user