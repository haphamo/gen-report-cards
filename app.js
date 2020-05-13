const fs = require("fs");
const csv = require("csv-parser");
const args = process.argv.slice(2);
const { addCourseWeightAndCourseId, readStudentDataAndSetUpFinalJsonStructure, readMarks, readTests, readCourses, generateJsonReportCardForAllStudents, checkSumOfAllCourseWeights } = require('./helperFunctions')

// an obj with student id's as keys and the values are the students marks & avgs
const jsonDataOfStudents = {};
// jsonDataOfStudents has to be manipulated to match the stucture JSON end result
let finalJsonResult = {};
// where I keep info after reading files, to do caluclations
const readCsvFiles = {
  allStudentIds: [],
  allCourses: {},
  allMarks: [],
  allTests: []
}

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

getAllCoursesAndGenerateJson(args[0])