const fs = require("fs");
const csv = require("csv-parser");
const args = process.argv.slice(2);


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

// reads the 4 csv files [courses, students, tests, marks] and stores data to be used in the generateReportCard function
const readCsvFile = (arg) => (
  new Promise((resolve, reject) => {
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
        switch(arg) {
          case 'courses.csv':
            allData.allCourses[row.id] = {id: row.id, name: row.name, teacher: row.teacher, numberOfTests: 0, totalTestWeight: 0}
            break;
          case 'students.csv':
            allData.allStudents.push({id: parseInt(row.id), name: row.name.trim()})
            break;
          case 'tests.csv':
            allData.allTests[row.id] = {test_id: parseInt(row.id), course_id: parseInt(row.course_id), weight: parseInt(row.weight)}
            break;
          case 'marks.csv':
            allData.allMarks.push({test_id: parseInt(row.test_id), student_id: parseInt(row.student_id), mark: parseInt(row.mark)})
            break;
          case 'output.json':
            break;
        }
      }
    })
    .on('end', () => {
      // sorts students by student number
      allData.allStudents.sort((a, b) => a.id - b.id)
      resolve(allData)
    })
    .on('error', error => reject(new Error(`Error: ${error}`)))
  })
);

(async function generateReportCard(commandLineArgs) {
  // don't want to map through the last item
  const awaitAllData = await Promise.all(commandLineArgs.map(arg => readCsvFile(arg)))
  // destructure
  const [{allCourses}, {allStudents}, {allTests}, {allMarks}] = awaitAllData

  calcNumberOfTestsPerCourse(allCourses, allTests);

  const marksWithCourseIdAndWeight = addCourseIdAndWeightToMarks(allMarks, allTests);

  const organizedMarks = await marksOfEachStudentByCourseId(marksWithCourseIdAndWeight);

  const studentDataWithTheirCourseAvgs = calculateAllCourseAvgsForEveryStudent(organizedMarks, allCourses);
  
  allStudents.map(student => {
    student.courses = studentDataWithTheirCourseAvgs[student.id]
  });
  
  const calculatedTotalAvg = calculateStudentAvg(allStudents)

  const stringified = JSON.stringify(allStudents);

  fs.writeFile(`${__dirname}/data/${commandLineArgs[4]}`, stringified, err => {
    if(err) {
      console.error(err);
    }
    console.log("Finished!");
  });
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
  data.map(student => {
    console.log(student)
    const sumOfCourseAvgs = student.courses.reduce((prev, curr) => prev + curr.courseAverage, 0)
    const numberOfEnrolledCourses = student.courses.length
    const totalAvg = parseFloat((sumOfCourseAvgs / numberOfEnrolledCourses).toFixed(2))
    student.totalAverage = totalAvg
  })
  return data
};


module.exports = {
  addCourseIdAndWeightToMarks,
  marksOfEachStudentByCourseId,
  calculateAllCourseAvgsForEveryStudent,
  calcNumberOfTestsPerCourse,
  calculateStudentAvg
}