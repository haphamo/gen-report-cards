// calculates the total student avg, the arg passed is an array of objects which consist of the individual course avgs of each student
const calculateStudentAverage = function(courseAveragesArg) {
  const sum = courseAveragesArg.reduce((acc, curr) => (acc + curr.courseAverage), 0) 
  return parseFloat((sum / courseAveragesArg.length).toFixed(2))
}

module.exports = {
  calculateStudentAverage
}