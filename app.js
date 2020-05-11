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

let allStudentIds = [];
let allCourses = {};
let allMarks = [];
let allTests = [];

async function getAllStudents() {
  try {
    fs.createReadStream(`data/${args[1]}`)
      .pipe(csv())
      .on("data", (row) => {
        readStudentDataAndSetUpFinalJsonStructure(allStudentIds, row, jsonDataOfStudents)
      })
      .on("end", () => {
        console.log("Reading Student Data Complete!");
      })
  } catch (err) {
    console.error("Error!");
  }
};

async function getAllMarks() {
  try {
    fs.createReadStream(`data/${args[3]}`)
      .pipe(csv())
      .on("data", (row) => {
       readMarks(allMarks, row)
      })
      .on("end", (row) => {
        console.log("Reading Marks Data Complete!")
      });
  } catch (err) {
    console.error(err);
  }
}

async function addCourseAndWeightToMarks() {
  try {
    fs.createReadStream(`data/${args[2]}`)
      .pipe(csv())
      .on("data", (row) => {
        readTests(allTests, row)
      })
      .on("end", () => {
        addCourseWeightAndCourseId(allMarks, allTests)
        console.log("Reading Tests and added Course Weight and Id Complete!");
      });
  } catch (err) {
    console.error(err);
  }
}

async function getAllCoursesAndGenerateJson() {
    getAllStudents();
    getAllMarks();
    addCourseAndWeightToMarks();
  try {
    fs.createReadStream(`data/${args[0]}`)
    .pipe(csv())
    .on("data", (row) => {
      readCourses(allCourses, row)
    })
    .on("end", () => {
      // 
      generateJsonReportCardForAllStudents(allStudentIds, allCourses, allMarks, jsonDataOfStudents)
      finalJsonResult = JSON.stringify({
        students: Object.values(jsonDataOfStudents),
      });

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

getAllCoursesAndGenerateJson()


// NTS--------------
// JSON result is an obj with a students key (arr)
// students.csv has a similar to the final result
// use map to generate the students arr
// node app.js courses.csv students.csv tests.csv marks.csv output.json
// fs.createReadStream: It will read the file in chunks of the size which is specified before hand
// fs.readFile: It will read the file completely into memory before making it available for the user
