const fs = require("fs");
// const fsp = require("fs").promises;
const csv = require("csv-parser");
const args = process.argv.slice(2);
const { addCourseWeightAndCourseId, readStudentDataAndSetUpFinalJsonStructure, readMarks, readTests, readCourses, generateJsonReportCardForAllStudents } = require('./helperFunctions')

// an obj with student id's as keys and the values are the students marks & avgs
const jsonDataOfStudents = {};
// jsonDataOfStudents has to be manipulated to match the stucture JSON end result
let finalJsonResult = {};

const readCsvFiles = {
  allStudentIds: [],
  allCourses: [],
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
        // console.log(jsonDataOfStudents)
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
        console.log("Reading Tests and added Course Weight and Id Complete!");
      });
  } catch (err) {
    console.error(err);
  }
}

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
      // console.log('here: ', jsonDataOfStudents)
      console.log("Finished reading all courses and final JSON is almost complete!")
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

// NTS--------------
// fs.createReadStream: It will read the file in chunks of the size which is specified before hand
// fs.readFile: It will read the file completely into memory before making it available for the user
