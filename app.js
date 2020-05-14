const fs = require("fs");
const csv = require("csv-parser");
const args = process.argv.slice(2);
const csvFast = require('fast-csv');
const { addCourseWeightAndCourseId, readStudentDataAndSetUpFinalJsonStructure, readMarks, readTests, readCourses, generateJsonReportCardForAllStudents, checkSumOfAllCourseWeights } = require('./helperFunctions')

// an obj with student id's as keys and the values are the students marks & avgs
const jsonDataOfStudents = {};
// jsonDataOfStudents has to be manipulated to match the stucture JSON end result
let finalJsonResult = {};
// where I keep data after reading files, to do caluclations
const readCsvFiles = {
  allStudentIds: [],
  allCourses: {},
  allMarks: [],
  allTests: []
}

const readStudentsStream = fs.createReadStream('data/students.csv')

const setUpFinalJsonWithStudents = function(stream) {
  return new Promise(function(resolve, reject) {
    const result = {students:[]}
    stream.pipe(csv())
    .on('data', row => {
      // handles empty lines
      if(Object.keys(row).length > 0) {
      // added a trim on the row.name, just in case the names have space in them
      result.students.push({id: parseInt(row.id), name: row.name.trim()})
      }
    })
    .on('end', () => resolve(result))
    .on('error', error => reject(new Error(`Error: ${error}`)))
  })
}

// from the students ids in result, find all the test written by a student
// add course id and weight for each mark
const readAllMarks = function() {
  return new Promise(function(resolve, reject) {
    const allMarks = []
    
    fs.createReadStream('data/marks.csv')
    .pipe(csv())
    .on('data', row => {
      
      if(Object.keys(row).length > 0) {
        // added a trim on the row.name, just in case the names have space in them
        allMarks.push({test_id: parseInt(row.test_id), student_id: parseInt(row.student_id), mark: parseInt(row.mark)})
      }
    })
    .on('end', () => resolve(allMarks))
    .on('error', error => reject(new Error(`Error: ${error}`)))
  })
}

const getAllTests = function() {
  return new Promise(function(resolve, reject) {
    const allTests = {}
    fs.createReadStream('data/tests.csv')
    .pipe(csv())
    .on('data', row => {
      if(Object.keys(row).length > 0) {
        allTests[row.id] = {test_id: parseInt(row.id), course_id: parseInt(row.course_id), weight: parseInt(row.weight)}
      }
    })
    .on('end', () => resolve(allTests))
    .on('error', error => reject(new Error(`Error: ${error}`)))
  })
}

const addCourseIdAndWeightToMarks = function(allMarks, allTests) {
  allMarks.map(mark => {
    mark.course_id = allTests[mark.test_id].course_id
    mark.weight = allTests[mark.test_id].weight
  })
  return allMarks
}

async function test() {
  const resultOne = await readAllMarks()
  const resultTwo = await getAllTests()
  const final = addCourseIdAndWeightToMarks(resultOne, resultTwo)
  console.log(final)
  const stringify = JSON.stringify(final)
  fs.writeFile('data/output.json', stringify, err => {
    if(err) {
      console.error(err)
    }
    console.log("Finished!")
  })
}

const fixture = [
  { test_id: 1, student_id: 1, mark: 78, course_id: 1, weight: 10 },
  { test_id: 2, student_id: 1, mark: 87, course_id: 1, weight: 40 },
  { test_id: 3, student_id: 1, mark: 95, course_id: 1, weight: 50 },
  { test_id: 4, student_id: 1, mark: 32, course_id: 2, weight: 40 },
  { test_id: 5, student_id: 1, mark: 65, course_id: 2, weight: 60 },
  { test_id: 6, student_id: 1, mark: 78, course_id: 3, weight: 90 },
  { test_id: 7, student_id: 1, mark: 40, course_id: 3, weight: 10 },
  { test_id: 1, student_id: 2, mark: 78, course_id: 1, weight: 10 },
  { test_id: 2, student_id: 2, mark: 87, course_id: 1, weight: 40 },
  { test_id: 3, student_id: 2, mark: 15, course_id: 1, weight: 50 },
  { test_id: 6, student_id: 2, mark: 78, course_id: 3, weight: 90 },
  { test_id: 7, student_id: 2, mark: 40, course_id: 3, weight: 10 },
  { test_id: 1, student_id: 3, mark: 78, course_id: 1, weight: 10 },
  { test_id: 2, student_id: 3, mark: 87, course_id: 1, weight: 40 },
  { test_id: 3, student_id: 3, mark: 95, course_id: 1, weight: 50 },
  { test_id: 4, student_id: 3, mark: 32, course_id: 2, weight: 40 },
  { test_id: 5, student_id: 3, mark: 65, course_id: 2, weight: 60 },
  { test_id: 6, student_id: 3, mark: 78, course_id: 3, weight: 90 },
  { test_id: 7, student_id: 3, mark: 40, course_id: 3, weight: 10 }
]


test()
// console.log(addCourseIdAndWeightToMarks(fix1, fix2))

// setUpFinalJsonWithStudents(readStudentsStream).then(resolve => console.log(resolve))



// getAllTests().then(res => console.log(res))
// execute test read then pass result into allMarks


/////////////////////////////////////////////////////

async function getAllStudents(studentsCsv) {
  try {
    fs.createReadStream(`data/${studentsCsv}`)
      .pipe(csv())
      .on("data", (row) => {
        readStudentDataAndSetUpFinalJsonStructure(readCsvFiles, row, jsonDataOfStudents)
      })
      .on("end", () => {
        console.log("Reading Student Data Complete!");
      })
  } catch (err) {
    console.error("Error!");
  }
};

async function getAllMarks(marksCsv) {
  try {
    fs.createReadStream(`data/${marksCsv}`)
      .pipe(csv())
      .on("data", (row) => {
       readMarks(readCsvFiles, row)
      })
      .on("end", (row) => {
        console.log("Reading Marks Data Complete!")
      });
  } catch (err) {
    console.error(err);
  }
}

async function addCourseAndWeightToMarks(testsCsv) {
  try {
    fs.createReadStream(`data/${testsCsv}`)
      .pipe(csv())
      .on("data", (row) => {
        readTests(readCsvFiles, row)
      })
      .on("end", () => {
        addCourseWeightAndCourseId(readCsvFiles)
        console.log("Reading Tests Data Complete!");
      });
  } catch (err) {
    console.error(err);
  }
}

// this is the final read and the readCsvFiles obj has all the data required to do calculations
async function getAllCoursesAndGenerateJson(coursesCsv) {
  getAllStudents(args[1]);
  getAllMarks(args[3]);
  addCourseAndWeightToMarks(args[2]);
  try {
    fs.createReadStream(`data/${coursesCsv}`)
    .pipe(csv())
    .on("data", (row) => {
      readCourses(readCsvFiles, row)
    })
    .on("end", () => {
      generateJsonReportCardForAllStudents(readCsvFiles, jsonDataOfStudents)
      finalJsonResult = JSON.stringify({
        students: Object.values(jsonDataOfStudents),
      });
      console.log("Reading courses data complete! Final JSON is almost ready!")
      checkSumOfAllCourseWeights(readCsvFiles)
      fs.writeFile(`data/${args[4]}`, finalJsonResult, (err) => {
        if(err) {
          console.error(err)
        }
        console.log("Writing Sucessful and Complete!")
      })
    })
  } catch(err) {
    console.error(err)
  }
}

// getAllCoursesAndGenerateJson(args[0])