const fs = require("fs");
const fsp = require("fs").promises;
const csv = require("csv-parser");
const args = process.argv.slice(2);

// final JSON
const finalOutput = {};
let allStudentIds = []
let allCourses = {};
let allMarks = [];
let allTests = [];
// let testsData = {};

// console.log(args) // => [ 'courses.csv', 'students.csv', 'tests.csv', 'marks.csv', output.json ]

async function getAllStudents() {
  try {
    fs.createReadStream(`data/${args[1]}`)
      .pipe(csv())
      .on('data', (row) => {
        allStudentIds.push({id: parseInt(row.id),
            name: row.name,
            totalAverage: 0});
        finalOutput[row.id] = {id: parseInt(row.id),
          name: row.name,
          totalAverage: 0,
          courses: []};
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
  getAllStudents();
  getAllMarks();
  addCourseAndWeightToMarks();
  try {
    fs.createReadStream(`data/${args[0]}`)
    .pipe(csv())
    .on("data", (row) => {
      // allCourses.push({id: parseInt(row.id), name: row.name, teacher: row.teacher})
      allCourses[row.id] = {id: parseInt(row.id), name: row.name, teacher: row.teacher}
    })
    .on("end", () => {
      // Later: make into a helper function
      allStudentIds.map(function(student) {
        // this variable creates an array of all tests written each student in the students.csv
        const allTestsWrittenByEachStudent = getAllMarksForAStudent(student.id, allMarks)
        // this variable filters all the tests and creates an obj with keys being the course if and the values is an array with the marks and weight calculation
        const allTestsByCourses = getAllMarksForEachCourse(allTestsWrittenByEachStudent)

        // console.log(allTestsByCourses)

        const courseIdWithCourseAvgOfStudent = getCourseAverages(allTestsByCourses)

        // console.log(courseIdWithCourseAvgOfStudent)

        finalOutput[student.id].courses = courseIdWithCourseAvgOfStudent

        const totalGradeAvgOfStudent = getStudentAverage(courseIdWithCourseAvgOfStudent)
        // calculates the total avg for all courses
        finalOutput[student.id].totalAverage = totalGradeAvgOfStudent
      })
      // below returns the final JSON result as a value
      const stringifiedOutput = JSON.stringify({ students: Object.values(finalOutput) })
      console.log("Finished reading all courses.")

      fs.writeFileSync(`data/${args[4]}`, stringifiedOutput, 'utf8', err  => {
 
        if(err) {
          console.error(err)
        } else {
          console.log("File Written Successful!")
        }
      })
    })
  } catch(err) {
    console.error(err)
  }
}

getAllCourses();

const getAllMarksForAStudent = (student_id, dataObj) => (
  dataObj.filter(mark => mark.student_id === student_id)
)

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

// console.log(allMarksForEachCourse)
const getCourseAverages = function(allTestsByCourses, allCoursesData) {
  const result = [];
  const dataObjToArr = Object.entries(allTestsByCourses)
  for(let course of dataObjToArr) {
    const courseAverage = course[1].reduce((acc, curr) => acc + curr)
    result.push({id: Number(course[0]), courseAverage: Number(courseAverage.toFixed(2))})
  }

  // ADD: Course teacher and name
  result.map(courseAvg => {
    courseAvg.name = allCourses[courseAvg.id].name
    courseAvg.teacher = allCourses[courseAvg.id].teacher
  })

  return result;
}

const getStudentAverage = function(courseAveragesArg) {
  // console.log(courseAveragesArg)
  // the args passed in is an array of objects
  const sum = courseAveragesArg.reduce((acc, curr) => (acc + curr.courseAverage), 0) 
  return parseFloat((sum / courseAveragesArg.length).toFixed(2))
}

// NTS--------------
// JSON result is an obj with a students key (arr)
// students.csv has a similar to the final result
// use map to generate the students arr
// node app.js courses.csv students.csv tests.csv marks.csv output.json
// fs.createReadStream: It will read the file in chunks of the size which is specified before hand
// fs.readFile: It will read the file completely into memory before making it available for the user
