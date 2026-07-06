const { Parser } = require('json2csv');

const FIELDS = [
  { label: 'Student Name', value: 'studentName' },
  { label: 'Email', value: 'email' },
  { label: 'Student ID', value: 'studentId' },
  { label: 'Course Code', value: 'courseCode' },
  { label: 'Session Date', value: 'sessionDate' },
  { label: 'Scanned At', value: 'scannedAt' },
  { label: 'Status', value: 'status' }
];

function buildAttendanceCsv(rows) {
  const parser = new Parser({ fields: FIELDS });
  return parser.parse(rows);
}

module.exports = { buildAttendanceCsv };
