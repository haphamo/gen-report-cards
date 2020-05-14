const chai = require('chai');
const {assert, expect} = chai;
const { calculateStudentAverage } = require('../helperFunctions');

describe("#Title: Calculate Student Avg", function() {
  it("Should calculate correct total avgerage.", function() {
    const input = [
      { id: 1, courseAverage: 90.1, name: 'Chemistry', teacher: 'Ms. Daley' },
      { id: 2, courseAverage: 51.8, name: 'English', teacher: ' Mrs. Crawford' },
      { id: 3, courseAverage: 74.2, name: 'Business', teacher: ' Mrs. Patel' }
    ]

    assert.strictEqual(calculateStudentAverage(input), 72.03, "Returns the student");

  })

  it("Should return the average of all course averages", function() {
    const input = [
      { id: 4, courseAverage: 92.1, name: 'Chemistry', teacher: 'Ms. Daley' },
      { id: 2, courseAverage: 59.8, name: 'English', teacher: ' Mrs. Crawford' },
      { id: 3, courseAverage: 74.8, name: 'Business', teacher: ' Mrs. Patel' }
    ]

    expect(calculateStudentAverage(input)).to.equal(75.57);
  })
})