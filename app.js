const fs = require("fs");
const fsp = require("fs").promises;
const csv = require("csv-parser");
const args = process.argv.slice(2);

// final JSON
let result = {
  students: [],
};
let students = {};
let allCourses = [];
let allMarks = [];
let allTests = [];
let testsData = {};

// console.log(args) // => [ 'courses.csv', 'students.csv', 'tests.csv', 'marks.csv', output.json ]

async function readStudents() {
  try {
    fs.createReadStream(`data/${args[1]}`)
      .pipe(csv())
      .on("data", (row) => {
        students[row.id] = {
          id: parseInt(row.id),
          name: row.name,
          totalAverage: 0,
        };
      })
      .on("end", () => {
        console.log("finished Student Data");
      });
  } catch (err) {
    console.error("Error!");
  }
};

async function getAllMarks() {
  try {
    fs.createReadStream(`data/${args[3]}`)
      .pipe(csv())
      .on("data", (row) => {
        allMarks.push({ test_id: parseInt(row.test_id), student_id: parseInt(row.student_id), mark: parseInt(row.mark) })
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

async function addCourseAndWeightToMarks() {
  try {
    fs.createReadStream(`data/${args[2]}`)
      .pipe(csv())
      .on("data", (row) => {
        allTests.push({ id: parseInt(row.id), course_id: parseInt(row.course_id), weight: parseInt(row.weight) })
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

async function getAllCourses() {
    // this function must wait for functions below to complete before executing
  readStudents();
  getAllMarks();
  addCourseAndWeightToMarks();
  try {
    fs.createReadStream(`data/${args[0]}`)
    .pipe(csv())
    .on("data", (row) => {
      allCourses.push({id: parseInt(row.id), name: row.name, teacher: row.teacher})
    })
    .on("end", () => {
      // console.log(allMarks)
      // console.log("------------------------")
      // console.log(students)
      // console.log("------------------------")
      // console.log(allCourses)
      // console.log("Finished reading all courses.")
    })
  } catch(err) {
    console.error(err)
  }
}

getAllCourses();

const getAllMarksForAStudent = ((student_id, dataSet) => (
   dataSet.filter(mark => mark.student_id === student_id)
))

const fixture = [
  { test_id: 1, student_id: 1, mark: 78, course_id: 1, weight: 10 },
  { test_id: 2, student_id: 1, mark: 87, course_id: 1, weight: 40 },
  { test_id: 3, student_id: 1, mark: 95, course_id: 1, weight: 50 },
  { test_id: 4, student_id: 1, mark: 32, course_id: 2, weight: 40 },
  { test_id: 5, student_id: 1, mark: 65, course_id: 2, weight: 60 },
  { test_id: 6, student_id: 1, mark: 78, course_id: 3, weight: 90 },
  { test_id: 7, student_id: 1, mark: 40, course_id: 3, weight: 10 }
]


const getAllMarksForEachCourse = function(data) {
  const result = {};
  data.map(item => {
    
    if(!result[item.course_id]) {
      result[item.course_id] = [item.mark * (item.weight / 100)]
    } else {
      result[item.course_id].push(item.mark * (item.weight / 100))
    }
  })
  return result;
}

const allMarksForEachCourse = getAllMarksForEachCourse(fixture)

const getCourseAverages = function(dataObj) {
  const result = [];
  const dataObjToArr = Object.entries(dataObj)
  for(let course of dataObjToArr) {
    const courseAverage = course[1].reduce((acc, curr) => acc + curr)
    result.push({id: course[0], courseAverage: courseAverage})
  }
  return result;
}

const courseAverages = getCourseAverages(allMarksForEachCourse)
// console.log('courseAverages: ', courseAverages)

const getStudentAverage = function(courseAveragesArg) {
  // console.log(courseAveragesArg)
  // the args passed in is an arrat of objecgts
  const sum = courseAveragesArg.reduce((acc, curr) => (acc + curr.courseAverage), 0) 
  return (sum / courseAveragesArg.length).toFixed(2)
}

console.log(getStudentAverage(courseAverages))
// console.log(getStudentAverage(courseAverages))

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
