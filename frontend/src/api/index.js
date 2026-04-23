import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
})

// Προσθέτει αυτόματα το token σε κάθε request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const login = (data) => API.post('/auth/login', data)

// Resort
export const createSchool = (data) => API.post('/school/register', data)
export const getSchools = () => API.get('/resort/schools')

// School
export const createInstructor = (data) => API.post('/instructor/register', data)
export const getInstructors = () => API.get('/school/instructors')

// Lessons
export const createLesson = (data) => API.post('/lessons', data)
export const getLessons = () => API.get('/lessons')
export const deleteLesson = (id) => API.delete(`/lessons/${id}`)
export const updateLesson = (id, data) => API.put(`/lessons/${id}`, data)
export const cancelBooking = (id) => API.patch(`/lessons/bookings/${id}/cancel`)

export const getInstructorLessons = () => API.get('/instructor/lessons')

export const getAvailableSlots = (date, schoolId) => API.get(`/customer/slots?date=${date}&schoolId=${schoolId}`)
export const getMyBookings = () => API.get('/customer/bookings')
export const cancelCustomerBooking = (id) => API.patch(`/customer/bookings/${id}/cancel`)
export const bookLesson = (data) => API.post('/customer/bookings', data)

export const assignInstructor = (id, instructorId) => API.patch(`/lessons/${id}/assign`, { instructorId })

export const toggleSchool = (id) => API.patch(`/resort/${id}/toggle`)
export const deleteSchool = (id) => API.delete(`/resort/${id}`)

export const getStats = (dateFrom, dateTo) => API.get(`/lessons/stats?dateFrom=${dateFrom}&dateTo=${dateTo || dateFrom}`)

export const createOpenGroupLesson = (data) => API.post('/lessons/open-group', data)

export const getOpenGroups = (schoolId) => API.get(`/customer/open-groups?schoolId=${schoolId}`)
export const joinOpenGroup = (lessonId) => API.post('/customer/bookings', { lessonId, isOpenGroup: true })