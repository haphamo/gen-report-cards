const chai = require('chai');
const {assert, expect} = chai;
const { totalNumOfTestsForEachCourse } = require('../helperFunctions');

describe('Calculate number of tests for each course', function() {
  it("Should receive an input obj which contains a allTests key", function() {
    const input = {
      allTests: []
    }
    // expect.have.keys
    expect(input).to.have.keys('allTests')
    // assert.isDefined(input.allTests, 'allTests is defined.')
  })

  it("When the input does not have a defined allTests key, log an error", function() {
    const input = {
      allMarks: []
    }
    // expect(console.log(totalNumOfTestsForEachCourse(input)))
  })
})