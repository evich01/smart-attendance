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
  listStaff: () => client.get('/users/staff'),
  create: (payload) => client.post('/users', payload),
  update: (id, payload) => client.put(`/users/${id}`, payload),
  remove: (id) => client.delete(`/users/${id}`),
  toggleStatus: (id) => client.patch(`/users/${id}/status`)
};

export const departmentApi = {
  list: () => client.get('/departments'),
  create: (payload) => client.post('/departments', payload),
  update: (id, payload) => client.put(`/departments/${id}`, payload),
  remove: (id) => client.delete(`/departments/${id}`)
};

export const attendanceApi = {
  startCheckIn: (departmentId) => client.post('/attendance/sessions/check-in/start', { departmentId }),
  startCheckOut: (departmentId) => client.post('/attendance/sessions/check-out/start', { departmentId }),
  closeSession: (id) => client.patch(`/attendance/sessions/${id}/close`),
  getSessionQr: (id) => client.get(`/attendance/sessions/${id}/qr`),
  todaySessions: () => client.get('/attendance/sessions/today'),
  checkIn: (sessionId, sessionToken) => client.post('/attendance/check-in', { sessionId, sessionToken }),
  checkOut: (sessionId, sessionToken) => client.post('/attendance/check-out', { sessionId, sessionToken }),
  today: () => client.get('/attendance/today'),
  myToday: () => client.get('/attendance/my-today'),
  myHistory: (params) => client.get('/attendance/my-history', { params }),
  history: (params) => client.get('/attendance/history', { params }),
  updateRecord: (id, payload) => client.put(`/attendance/record/${id}`, payload)
};

export const reportApi = {
  attendanceReport: (params) => client.get('/reports/attendance', { params }),
  exportCsv: (params) => client.get('/reports/export/attendance', { params, responseType: 'blob' }),
  dashboardAnalytics: () => client.get('/reports/dashboard')
};

export const settingApi = {
  get: () => client.get('/settings'),
  update: (payload) => client.put('/settings', payload)
};

export const leaveApi = {
  submit: (payload) => client.post('/leaves', payload),
  myLeaves: (params) => client.get('/leaves/my', { params }),
  reviewList: (params) => client.get('/leaves/review', { params }),
  approveReject: (id, status, reviewNotes) => client.patch(`/leaves/${id}/review`, { status, reviewNotes })
};

export const auditApi = {
  list: (params) => client.get('/audit-logs', { params })
};

