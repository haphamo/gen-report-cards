const fs = require("fs");
const csv = require("csv-parser");
const args = process.argv.slice(2);
const csvFast = require('fast-csv');

// TO DO: Replace all paths with the command line args
const readAllStudentsAndSetUpFinalJson = function() {
  return new Promise(function(resolve, reject) {
    const result = {students:[]}
    fs.createReadStream('data/students.csv')
    .pipe(csv())
    .on('data', row => {
      // handles empty lines
      if(Object.keys(row).length > 0) {
      // added a trim on the row.name, just in case the names have space in them
      result.students.push({id: parseInt(row.id), name: row.name.trim()})
      }
      // sort students by id
      result.students.sort((a, b) => a.id - b.id)
      
    })
    .on('end', () => resolve(result))
    .on('error', error => reject(new Error(`Error: ${error}`)))
  })
};

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
};

const readAllTests = function() {
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
};

const addCourseIdAndWeightToMarks = function(allMarks, allTests) {
  allMarks.map(mark => {
    mark.course_id = allTests[mark.test_id].course_id
    mark.weight = allTests[mark.test_id].weight
  })
  return allMarks
};

const marksOfEachStudentByCourseId = function(marksWithCourseIdAndWeight) {
  // this function returns an object the student id as keys, the values is a collection of course id with the marks for the course
  const result = {}
  marksWithCourseIdAndWeight.map(mark => {
    if(!result[mark.student_id]) {
      // if the student id doesn't exist in result create one with the mark
      result[mark.student_id] = {[`${mark.course_id}`]: [parseInt(mark.mark) * (parseInt(mark.weight) / 100)]}
    } else {
      // when the student id exists, check to see if the course enrolled exists othewise create one
      if(!result[mark.student_id][mark.course_id]) {
        result[mark.student_id][mark.course_id] = [parseInt(mark.mark) * (parseInt(mark.weight) / 100)]
      } else {
        result[mark.student_id][mark.course_id].push(parseInt(mark.mark) * (parseInt(mark.weight) / 100))
      }
    }
  })
  return result
};

const calculateAllCourseAvgsForEveryStudent = function(objOfStudentsWithMarks, allCourses) {
  
  // receives the result from marksOfEachStudentByCourseId
  // read course data and add teacher and name
  const allStudentsWithCourseAvgs = {}
  for(let [studentId, courses] of Object.entries(objOfStudentsWithMarks)) {
    for(let [course, grades] of Object.entries(courses)) {
      let courseAvg;
      // compares the course's number of tests to the tests array length and gives the students a course avg of 0 if they've missed a test
      (grades.length < allCourses[course].numberOfTests) ? courseAvg = 0 : courseAvg = grades.reduce((prev, curr) => prev + curr, 0);
      
      const courseAveToTwoDecimal = parseFloat(courseAvg.toFixed(2))
      
      if(!allStudentsWithCourseAvgs[studentId]) {

        allStudentsWithCourseAvgs[studentId] = [{id: parseInt(allCourses[course].id), courseAverage: courseAveToTwoDecimal, name: allCourses[course].name, teacher: allCourses[course].teacher}]
      } else {
        allStudentsWithCourseAvgs[studentId].push({ id: parseInt(allCourses[course].id), courseAverage: courseAveToTwoDecimal, name: allCourses[course].name, teacher: allCourses[course].teacher, })
      } 
    }
  }
  console.log(allStudentsWithCourseAvgs)
  return allStudentsWithCourseAvgs
};

const readAllCourses = function() {
  return new Promise((resolve, reject) => {
    const allCourses = {}
    fs.createReadStream('data/courses.csv')
    .pipe(csv())
    .on('data', row => {
      allCourses[row.id] = {id: row.id, name: row.name, teacher: row.teacher, numberOfTests: 0}
    })
    .on('end', () => resolve(allCourses))
    .on('error', error => reject(new Error(`Error: ${error}`)))
  })
};

const calcNumberOfTestsPerCourse = function(allCourses, allTests) {
  Object.values(allTests).map(test => {
    allCourses[test.course_id].numberOfTests += 1;
  })
  return allCourses
};

(async function final() {
  // reads data from students.csv and sets up final json object
  const allStudents = await readAllStudentsAndSetUpFinalJson();
  // array of mark data from marks.csv
  const allMarks = await readAllMarks(); 
  // obj with test id's as keys and the course & weight as its value, data taken from tests.csv
  const allTests = await readAllTests(); 
  // obj with course id as keys and the name and teacher as it's value, data from courses.csv
  const allCourses = await readAllCourses();
  // maps through all the tests to find out the number of tests for every course
  const addedNumberOfTestsPerCourse = calcNumberOfTestsPerCourse(allCourses, allTests)
  // array of mark data which includes the course id and weight, this is to set up the calc
  const marksWithCourseIdAndWeight = addCourseIdAndWeightToMarks(allMarks, allTests);
  // the marks are calculated to include their weight and sorted by course and then by student id
  const organizedMarks = marksOfEachStudentByCourseId(marksWithCourseIdAndWeight);
  // course avgs are calculated for each student resulting in an object with the student id as keys and its value is an array of the courses enrolled with their course average
  const studentDataWithTheirCourseAvgs = calculateAllCourseAvgsForEveryStudent(organizedMarks, allCourses);
  // TO DO: calculate their total avg!
  allStudents.students.map(student => {
    student.courses = studentDataWithTheirCourseAvgs[student.id]
  });

  const stringified = JSON.stringify(allStudents);

  fs.writeFile('data/output.json', stringified, err => {
    if(err) {
      console.error(err);
    }
    console.log("Finished!");
  });
})();