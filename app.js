const fs              = require('fs');
const csv             = require('csv-parser')
const args            = process.argv.slice(2)

const rawStudentsData = []
const rawMarksData = args[1]
const rawTestsData = args[2]
const rawCoursesData = args[3]
// final json
const result = {
  students: []
}

fs.createReadStream(`./data/${args[1]}`)
  .pipe(csv())
  .on('data', (data) => {
    result.students.push({id: parseInt(data.id), name: data.name})

  })
  .on('end', () => {
    // sorts the students by id
    result.students.sort(function(a, b) { 
      return a.id - b.id;
    });
    console.log(result.students)

  })



// NTS--------------
// JSON result is an obj with a students key (arr)
// students.csv has a similar to the final result
// use map to generate the students arr
// node app.js courses.csv students.csv tests.csv marks.csv output.json
// fs.createReadStream: It will read the file in chunks of the size which is specified before hand
// fs.readFile: It will read the file completely into memory before making it available for the user


