import client from './client';

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  register: (payload) => client.post('/auth/register', payload),
  me: () => client.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    client.put('/auth/change-password', { currentPassword, newPassword })
};

export const userApi = {
  list: (params) => client.get('/users', { params }),
  stats: () => client.get('/users/stats'),
  listLecturers: () => client.get('/users/lecturers'),
  create: (payload) => client.post('/users', payload),
  update: (id, payload) => client.put(`/users/${id}`, payload),
  remove: (id) => client.delete(`/users/${id}`),
  toggleStatus: (id) => client.patch(`/users/${id}/status`)
};

export const courseApi = {
  listAll: () => client.get('/courses'),
  myCourses: () => client.get('/courses/my'),
  enrolledCourses: () => client.get('/courses/enrolled'),
  create: (payload) => client.post('/courses', payload),
  update: (id, payload) => client.put(`/courses/${id}`, payload),
  remove: (id) => client.delete(`/courses/${id}`),
  enroll: (id, email) => client.post(`/courses/${id}/enroll`, { email }),
  getUnenrolledStudents: (id, search) => client.get(`/courses/${id}/unenrolled-students`, { params: { search } })
};

export const attendanceApi = {
  createSession: (courseId, title) => client.post('/attendance/session', { courseId, title }),
  getSessionQr: (id) => client.get(`/attendance/session/${id}/qr`),
  endSession: (id) => client.patch(`/attendance/session/${id}/end`),
  liveAttendance: (id) => client.get(`/attendance/session/${id}/live`),
  scan: (sessionId, token) => client.post('/attendance/scan', { sessionId, token })
};

export const reportApi = {
  courseReport: (courseId) => client.get(`/reports/course/${courseId}`),
  institutionReport: () => client.get('/reports/institution'),
  studentHistory: () => client.get('/reports/student/history'),
  exportCsvUrl: (courseId) => `${client.defaults.baseURL}/reports/export/${courseId}`
};

export const settingApi = {
  get: () => client.get('/settings'),
  update: (payload) => client.put('/settings', payload)
};
