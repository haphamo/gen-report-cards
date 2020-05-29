const fs = require("fs");
const csv = require("csv-parser");
const args = process.argv.slice(2);

const readAllStudentsAndSetUpFinalJson = () => (
  new Promise((resolve, reject) => {
    const result = {students:[]}
    fs.createReadStream(`data/${args[1]}`)
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
);

const readAllMarks = () => (
  new Promise((resolve, reject) => {
    const allMarks = []
    fs.createReadStream(`data/${args[3]}`)
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
);

const readAllTests = () => (
  new Promise((resolve, reject) => {
    const allTests = {}
    fs.createReadStream(`data/${args[2]}`)
    .pipe(csv())
    .on('data', row => {
      if(Object.keys(row).length > 0) {
        allTests[row.id] = {test_id: parseInt(row.id), course_id: parseInt(row.course_id), weight: parseInt(row.weight)}
      }
    })
    .on('end', () => resolve(allTests))
    .on('error', error => reject(new Error(`Error: ${error}`)))
  })
);

const addCourseIdAndWeightToMarks = (allMarks, allTests) => {
  allMarks.map(mark => {
    mark.course_id = allTests[mark.test_id].course_id
    mark.weight = allTests[mark.test_id].weight
  })
  return allMarks
};

const marksOfEachStudentByCourseId = (marksWithCourseIdAndWeight) => {
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

const calculateAllCourseAvgsForEveryStudent = (objOfStudentsWithMarks, allCourses) => {
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
        allStudentsWithCourseAvgs[studentId].push({ id: parseInt(allCourses[course].id), courseAverage: courseAveToTwoDecimal, name: allCourses[course].name, teacher: allCourses[course].teacher})
      } 
    }
  }
  return allStudentsWithCourseAvgs
};

const readAllCourses = (arg) => (
  new Promise((resolve, reject) => {
    // const allCourses = {}
    const allData = {
      allCourses: {},
      allStudents: [],
      allTests: {},
      allMarks: []
    }
    fs.createReadStream(`${__dirname}/data/${arg}`)
    .pipe(csv())
    .on('data', row => {
      if(Object.keys(row).length > 0) {
        if(arg === 'courses.csv') {
          allData.allCourses[row.id] = {id: row.id, name: row.name, teacher: row.teacher, numberOfTests: 0, totalTestWeight: 0}
        }
        if(arg === 'students.csv') {
          allData.allStudents.push({id: parseInt(row.id), name: row.name.trim()})
        }
        if(arg === 'tests.csv') {
          allData.allTests[row.id] = {test_id: parseInt(row.id), course_id: parseInt(row.course_id), weight: parseInt(row.weight)}
        }
        if(arg === 'marks.csv') {
          allData.allMarks.push({test_id: parseInt(row.test_id), student_id: parseInt(row.student_id), mark: parseInt(row.mark)})
        }
      }
    })
    .on('end', () => resolve(allData))
    .on('error', error => reject(new Error(`Error: ${error}`)))
  })
);


(async function awaitAll(commandLineArgs) {
  // console.log(commandLineArgs)
  const c = await readAllCourses(commandLineArgs[0])
  const s = await readAllCourses(commandLineArgs[1])
  const t = await readAllCourses(commandLineArgs[2])
  const m = await readAllCourses(commandLineArgs[3])
  let test = await Promise.all([c, s, t, m])
  // destructure
  // console.log(test)
  console.log(test[0].allCourses)
  console.log(test[1].allStudents)
  console.log(test[2].allTests)
  console.log(test[3].allMarks)
})(args);



// Also checks sum of all course weights! Handle error when total test weights do not add up to 100
const calcNumberOfTestsPerCourse = (allCourses, allTests) => {
  Object.values(allTests).map(test => {
    allCourses[test.course_id].numberOfTests += 1;
    allCourses[test.course_id].totalTestWeight += test.weight
  });
  Object.values(allCourses).map(course => {
    if(course.totalTestWeight !== 100) {
      console.log(new Error('Course weights do not add up to 100!'))
    }
  })
  return allCourses
};

const calculateStudentAvg = (data) => {
  data.students.map(student => {
    const sumOfCourseAvgs = student.courses.reduce((prev, curr) => prev + curr.courseAverage, 0)
    const numberOfEnrolledCourses = student.courses.length
    const totalAvg = parseFloat((sumOfCourseAvgs / numberOfEnrolledCourses).toFixed(2))
    student.totalAverage = totalAvg
  })
  return data
};

async function finalJsonOutput() {
  // reads data from students.csv and sets up final json object
  const allStudents = await readAllStudentsAndSetUpFinalJson();
  // array of mark data from marks.csv
  const allMarks = await readAllMarks(); 
  // obj with test id's as keys and the course & weight as its value, data taken from tests.csv
  const allTests = await readAllTests();
  // obj with course id as keys and the name and teacher as it's value, data from courses.csv
  const allCourses = await readAllCourses();
  // maps through all the tests to find out the number of tests for every course
  calcNumberOfTestsPerCourse(allCourses, allTests)
  // array of mark data which includes the course id and weight, this is to set up the calc
  const marksWithCourseIdAndWeight = addCourseIdAndWeightToMarks(allMarks, allTests);
  // the marks are calculated to include their weight and sorted by course and then by student id
  const organizedMarks = await marksOfEachStudentByCourseId(marksWithCourseIdAndWeight);
  // course avgs are calculated for each student resulting in an object with the student id as keys and its value is an array of the courses enrolled with their course average
  const studentDataWithTheirCourseAvgs = calculateAllCourseAvgsForEveryStudent(organizedMarks, allCourses);
  // adds the courses enrolled with course avgs for all students
  allStudents.students.map(student => {
    student.courses = studentDataWithTheirCourseAvgs[student.id]
  });
  // adds totalAverage key to each student
  const calculatedTotalAvg = calculateStudentAvg(allStudents)

  const stringified = JSON.stringify(allStudents);

  fs.writeFile(`data/${args[4]}`, stringified, err => {
    if(err) {
      console.error(err);
    }
    console.log("Finished!");
  });
};

module.exports = {
  readAllStudentsAndSetUpFinalJson,
  readAllMarks,
  readAllTests,
  readAllCourses,
  calculateAllCourseAvgsForEveryStudent,
  addCourseIdAndWeightToMarks,
  marksOfEachStudentByCourseId,
  calculateStudentAvg,
  calcNumberOfTestsPerCourse
}