// calculates the total student avg, the arg passed is an array of objects which consist of the individual course avgs of each student
const calculateStudentAverage = (courseAveragesArg) => {
  const sum = courseAveragesArg.reduce(
    (acc, curr) => acc + curr.courseAverage,
    0
  );
  return parseFloat((sum / courseAveragesArg.length).toFixed(2));
};

// filters an array of all tests to return only tests corresponding to a student id
const filterMarks = (student_id, readCsvFiles) => {
  return readCsvFiles.allMarks.filter((mark) => mark.student_id == student_id);
}

// finds the course that the test is associated with
const findCourse = (test_id, readCsvFiles) =>
  readCsvFiles.allTests.filter((test) => parseInt(test.id) === parseInt(test_id));

// Adds the course weight and id keys to each test obj
const addCourseWeightAndCourseId = (readCsvFiles) => {
  // console.log('data: ', readCsvFiles)
  readCsvFiles.allMarks.map((mark) => {
    // find the associated course to each test
    const addCourseAndWeight = findCourse(mark.test_id, readCsvFiles);
    
    mark.course_id = addCourseAndWeight[0].course_id;
    mark.weight = addCourseAndWeight[0].weight;
  });
};

const calculateAllMarksForEachCourse = (allTestsWrittenByASingleStudent) => {
  // receives an array all the tests written by a student
  // returns an obj of the course id as keys with an array of calculated test marks (includes the test weight)
  const result = {};
  allTestsWrittenByASingleStudent.map((item) => {
    if (!result[item.course_id]) {
      result[item.course_id] = [item.mark * (item.weight / 100)];
    } else {
      result[item.course_id].push(item.mark * (item.weight / 100));
    }
  });
  return result;
};

// receives array of marks for a course, calculates the course avg and adds in the name and teacher at the end
const calculateCourseAverages = (allTestsByCourses, readCsvFiles) => {
  // create async function to calculate the result to return then map through it
  let result = [];
  const dataObjToArr = Object.entries(allTestsByCourses);

  dataObjToArr.map(course => {
    // checks if number of tests written for a course matches the total number of tests for a course
    // if student has written all tests for a course, function proceeds to calculate the course avg
    if(course[1].length === readCsvFiles.allCourses[course[0]].numOfTests) {
      const courseAverage = course[1].reduce((acc, curr) => acc + curr);
      result.push({
        id: Number(course[0]),
        courseAverage: Number(courseAverage.toFixed(2)),
      });
      // otherwise the student receives a 0 if they have missed a test
    } else {
      result.push({
        id: Number(course[0]),
        courseAverage: 0,
      });
      // console.log(`Student has missed tests! Course avg for ${readCsvFiles.allCourses[course[0]].name} is 0!!`)
    }
  })
 
  // Add course teacher and name to each student course avg
  result.map(courseAvg => {
    courseAvg.name = readCsvFiles.allCourses[courseAvg.id].name;
    courseAvg.teacher = readCsvFiles.allCourses[courseAvg.id].teacher;
  });
  return result;
};

// reads the students.csv file to do two things:
// 1. pushes each unique student into an empty arr (the first arg), the result is used to a calculate the avgs in a different function
// 2. sets up the final JSON output with the student id and name
const readStudentDataAndSetUpFinalJsonStructure = (
  readCsvFiles,
  studentRowFromCsv,
  finalJsonOutput
) => {
  // does not process data for empty rows
  if(Object.keys(studentRowFromCsv).length > 0) {
    readCsvFiles.allStudentIds.push({
      id: parseInt(studentRowFromCsv.id),
      name: studentRowFromCsv.name,
    });
  
    finalJsonOutput[studentRowFromCsv.id] = {
      id: parseInt(studentRowFromCsv.id),
      name: studentRowFromCsv.name,
      totalAverage: 0,
      courses: [],
    };
  }
};

// reads the marks.csv to push marks data into an array
const readMarks = (readCsvFiles, markRowFromCsv) => {
  // console.log('marks: ', markRowFromCsv)
  if(Object.keys(markRowFromCsv).length > 0) {
    readCsvFiles.allMarks.push({
      test_id: parseInt(markRowFromCsv.test_id),
      student_id: parseInt(markRowFromCsv.student_id),
      mark: parseInt(markRowFromCsv.mark),
    });
  }
}

// read tests.csv and creates and pushes data into an empty arr, so that the weights and course id can be added to each test written by the students
const readTests = (readCsvFiles, testRowFromCsv) => {
  // console.log('test: ', testRowFromCsv)
  if(Object.keys(testRowFromCsv).length > 0) {
    readCsvFiles.allTests.push({
      id: parseInt(testRowFromCsv.id),
      course_id: parseInt(testRowFromCsv.course_id),
      weight: parseInt(testRowFromCsv.weight),
    });
  }
}

const readCourses = (readCsvFiles, coursesRowFromCsv) => {
  if(Object.entries(coursesRowFromCsv).length !== 0) {
    readCsvFiles.allCourses[coursesRowFromCsv.id] = {
      id: parseInt(coursesRowFromCsv.id),
      name: coursesRowFromCsv.name,
      teacher: coursesRowFromCsv.teacher,
      numOfTests: 0
    }
  }
}

const checkMissingTests = function(readCsvFiles) {
  readCsvFiles.allTests.map(test => {
    readCsvFiles.allCourses[test.course_id].numOfTests += 1
  })
}

// maps through an array of all students to create their report card object
const generateJsonReportCardForAllStudents = function(readCsvFiles, jsonDataOfStudents) {
  checkMissingTests(readCsvFiles)
  readCsvFiles.allStudentIds.map(function(student) {
    // this variable creates an array of all tests written each student in the students.csv
    const allTestsWrittenByEachStudent = filterMarks(student.id, readCsvFiles);
  
    const allTestsByCourses = calculateAllMarksForEachCourse(
      allTestsWrittenByEachStudent
    );

    const courseIdWithCourseAvgOfStudent = calculateCourseAverages(
      allTestsByCourses,
      readCsvFiles
    );

    // console.log(courseIdWithCourseAvgOfStudent)

    jsonDataOfStudents[student.id].courses = courseIdWithCourseAvgOfStudent;

    const totalGradeAvgOfStudent = calculateStudentAverage(
      courseIdWithCourseAvgOfStudent
    );
    // calculates the total avg for all courses
    jsonDataOfStudents[student.id].totalAverage = totalGradeAvgOfStudent;
  });
};

// The sum of all the weights of every test in a particular course should add up to 100
const checkSumOfAllCourseWeights = function(readCsvFiles) {
  const {allTests, allCourses} = readCsvFiles
  allTests.map(test => {
    allCourses[test.course_id].totalTestWeight ? allCourses[test.course_id].totalTestWeight += test.weight : allCourses[test.course_id].totalTestWeight = test.weight  
  })
  
  const coursesWhoseWeightDoNotAddUpTo100 = Object.values(allCourses).filter(course => 
     course.totalTestWeight < 100)
  
  const result = coursesWhoseWeightDoNotAddUpTo100.map(course => (`${course.name}: ${course.totalTestWeight}`))
  if(result.length === 0) {
    console.log(`All tests weights for each course add up to 100!`)
  } else {
    console.log(`There are courses whose tests weights do not add up to 100! ${result}`)
  }
}

module.exports = {
  addCourseWeightAndCourseId,
  readStudentDataAndSetUpFinalJsonStructure,
  readMarks,
  readTests,
  readCourses,
  generateJsonReportCardForAllStudents,
  checkSumOfAllCourseWeights
};