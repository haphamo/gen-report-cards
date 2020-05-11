// calculates the total student avg, the arg passed is an array of objects which consist of the individual course avgs of each student
const calculateStudentAverage = (courseAveragesArg) => {
  const sum = courseAveragesArg.reduce((acc, curr) => (acc + curr.courseAverage), 0) 
  return parseFloat((sum / courseAveragesArg.length).toFixed(2))
}

// filters an array of all tests to return only tests corresponding to a student id
const filterMarks = (student_id, allTests) => (
  allTests.filter(mark => mark.student_id === student_id)
)

// finds the course that the test is associated with
const findCourse = (test_id, allTests) => (
  allTests.filter(test => parseInt(test.id) === parseInt(test_id))
)

// Adds the course weight and id keys to each test obj
const addCourseWeightAndCourseId = (allMarks, allTests) => {
  allMarks.map(mark => {
    // find the associated course to each test
    const addCourseAndWeight = findCourse(mark.test_id, allTests)
    mark.course_id = addCourseAndWeight[0].course_id
    mark.weight = addCourseAndWeight[0].weight
  })
}

const calculateAllMarksForEachCourse = (allTestsWrittenByASingleStudent) => {
  // receives an array all the tests written by a student
  // returns an obj of the course id as keys with an array of calculated test marks (includes the test weight)
  const result = {};
  allTestsWrittenByASingleStudent.map(item => {
    if(!result[item.course_id]) {
      result[item.course_id] = [item.mark * (item.weight / 100)]
    } else {
      result[item.course_id].push(item.mark * (item.weight / 100))
    }
  })
  return result;
}

const calculateCourseAverages = (allTestsByCourses, allCoursesData) => {
  const result = [];
  const dataObjToArr = Object.entries(allTestsByCourses)
  for(let course of dataObjToArr) {
    const courseAverage = course[1].reduce((acc, curr) => acc + curr)
    result.push({id: Number(course[0]), courseAverage: Number(courseAverage.toFixed(2))})
  }
  // Add course teacher and name to each student course avg
  result.map(courseAvg => {
    courseAvg.name = allCoursesData[courseAvg.id].name
    courseAvg.teacher = allCoursesData[courseAvg.id].teacher
  })
  return result;
}

// reads the students.csv file to do two things:
// 1. pushes each unique student into an empty arr (the first arg), the result is used to a calculate the avgs in a different function
// 2. sets up the final JSON output with the student id and name
const readStudentDataAndSetUpFinalJsonStructure = (allStudentsArr, studentRowFromCsv, finalJsonOutput) => {
  allStudentsArr.push({id: parseInt(studentRowFromCsv.id),
    name: studentRowFromCsv.name});

    finalJsonOutput[studentRowFromCsv.id] = {id: parseInt(studentRowFromCsv.id),
    name: studentRowFromCsv.name,
    totalAverage: 0,
    courses: []};
}

// reads the marks.csv to push marks data into an array
const readMarks = (allMarksArr, markRowFromCsv) => (
  allMarksArr.push({ test_id: parseInt(markRowFromCsv.test_id), student_id: parseInt(markRowFromCsv.student_id), mark: parseInt(markRowFromCsv.mark) })
) 

// read tests.csv and creates and pushes data into an empty arr, so that the weights and course id can be added to each test written by the students
const readTests = (allTestsArr, testRowFromCsv) => allTestsArr.push({ id: parseInt(testRowFromCsv.id), course_id: parseInt(testRowFromCsv.course_id), weight: parseInt(testRowFromCsv.weight) })

const readCourses = (allCoursesArr, coursesRowFromCsv) => allCoursesArr[coursesRowFromCsv.id] = {id: parseInt(coursesRowFromCsv.id), name: coursesRowFromCsv.name, teacher: coursesRowFromCsv.teacher}

// maps through an array of all students to create their report card object
const generateJsonReportCardForAllStudents = function(allStudentsArr, allCoursesArr, allMarks, finalJsonOutput) {
  allStudentsArr.map(function(student) {
   // this variable creates an array of all tests written each student in the students.csv
   const allTestsWrittenByEachStudent = filterMarks(student.id, allMarks)
   // this variable filters all the tests and creates an obj with keys being the course if and the values is an array with the marks and weight calculation
   const allTestsByCourses = calculateAllMarksForEachCourse(allTestsWrittenByEachStudent)
 
   const courseIdWithCourseAvgOfStudent = calculateCourseAverages(allTestsByCourses, allCoursesArr)
 
   finalJsonOutput[student.id].courses = courseIdWithCourseAvgOfStudent
 
   const totalGradeAvgOfStudent = calculateStudentAverage(courseIdWithCourseAvgOfStudent)
   // calculates the total avg for all courses
   finalJsonOutput[student.id].totalAverage = totalGradeAvgOfStudent
 })
}

module.exports = {
  addCourseWeightAndCourseId,
  readStudentDataAndSetUpFinalJsonStructure,
  readMarks,
  readTests,
  readCourses,
  generateJsonReportCardForAllStudents
}