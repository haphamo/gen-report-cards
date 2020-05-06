const fs = require("fs");
const fsp = require("fs").promises;
const csv = require("csv-parser");
const args = process.argv.slice(2);

// final JSON
let result = {
  students: [],
};
let students = {};
let allCourses = {};
let allMarks = [];
let allTests = [];
let testsData = {};

// console.log(args) // => [ 'courses.csv', 'students.csv', 'tests.csv', 'marks.csv', output.json ]

async function readStudents() {
  try {
    fs.createReadStream(`./data/${args[1]}`)
      .pipe(csv())
      .on("data", (row) => {
        students[row.id] = {
          id: parseInt(row.id),
          name: row.name,
          totalAverage: 0,
          marks: [],
        };
        // result.students.sort(function(a, b) {
        //       return a.id - b.id;
        //     });
      })
      .on("end", () => {
        // fs.createWriteStream(`data/${args[4]}`, 'utf8')
        // .write(JSON.stringify(result));
        console.log("finished Student Data");
      });
  } catch (err) {
    console.error("Error!");
  }
};

async function addMarks() {
  // await readStudents();
  try {
    fs.createReadStream(`./data/${args[3]}`)
      .pipe(csv())
      .on("data", (row) => {
        allMarks.push(row)
      })
      .on("end", (row) => {
        console.log("Finished Marks data")
      });
  } catch (err) {
    console.error(err);
  }
}
// Helper function, finds the corresponding course and weight for a test id
const findCourse = (test_id) => (
  allTests.filter(test => parseInt(test.id) === parseInt(test_id))
)

async function addTests() {
  readStudents();
  addMarks();
  try {
    fs.createReadStream(`./data/${args[2]}`)
      .pipe(csv())
      .on("data", (row) => {
        allTests.push(row)
      })
      .on("end", () => {
        allMarks.map(mark => {
          const addCourseAndWeight = findCourse(mark.test_id)
          mark.course_id = addCourseAndWeight[0].course_id
          mark.weight = addCourseAndWeight[0].weight
        })
        console.log("Finished adding tests");
      });
  } catch (err) {
    console.error(err);
  }
}
addTests();


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
