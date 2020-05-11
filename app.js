const fs = require("fs");
// const fsp = require("fs").promises;
const csv = require("csv-parser");
const args = process.argv.slice(2);
const { addCourseWeightAndCourseId, readStudentDataAndSetUpFinalJsonStructure, readMarks, readTests, readCourses, generateJsonReportCardForAllStudents } = require('./helperFunctions')

const finalOutput = {};
let allStudentIds = [];
let allCourses = {};
let allMarks = [];
let allTests = [];
// console.log(args) // => [ 'courses.csv', 'students.csv', 'tests.csv', 'marks.csv', output.json ]

async function getAllStudents() {
  try {
    fs.createReadStream(`data/${args[1]}`)
      .pipe(csv())
      .on('data', (row) => {
        readStudentDataAndSetUpFinalJsonStructure(allStudentIds, row, finalOutput)
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

async function getAllCourses() {
  // this function must wait for functions below to complete before executing
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
      generateJsonReportCardForAllStudents(allStudentIds, allCourses, allMarks, finalOutput)

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



// NTS--------------
// JSON result is an obj with a students key (arr)
// students.csv has a similar to the final result
// use map to generate the students arr
// node app.js courses.csv students.csv tests.csv marks.csv output.json
// fs.createReadStream: It will read the file in chunks of the size which is specified before hand
// fs.readFile: It will read the file completely into memory before making it available for the user
