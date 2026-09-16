const { Parser } = require('json2csv');

const ATTENDANCE_FIELDS = [
  { label: 'Employee Name', value: 'employeeName' },
  { label: 'Email', value: 'email' },
  { label: 'Employee ID', value: 'employeeId' },
  { label: 'Department', value: 'department' },
  { label: 'Date', value: 'date' },
  { label: 'Check-In Time', value: 'checkInTime' },
  { label: 'Check-Out Time', value: 'checkOutTime' },
  { label: 'Status', value: 'status' },
  { label: 'Working Duration (minutes)', value: 'workingDuration' }
];

function buildAttendanceCsv(rows) {
  const parser = new Parser({ fields: ATTENDANCE_FIELDS });
  return parser.parse(rows);
}

module.exports = { buildAttendanceCsv };
