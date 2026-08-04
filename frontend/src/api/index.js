import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
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
export const joinOpenGroup = (lessonId, preferredHours = []) => API.post('/customer/bookings', { lessonId, isOpenGroup: true, preferredHours })
export const createReview = (data) => API.post('/reviews', data)
export const getInstructorReviews = (instructorId) => API.get(`/reviews/instructor/${instructorId}`)

export const getMyReviews = () => API.get('/instructor/reviews')

export const getSchoolProfile = (id) => API.get(`/customer/schools/${id}`)
export const getInstructorProfile = (id) => API.get(`/customer/instructor/${id}`)

export const evaluateLevel = (answers) => API.post('/quiz/evaluate', { answers })

export const getOverview = () => API.get('/superadmin/overview')
export const getAllResorts = () => API.get('/superadmin/resorts')
export const getAllCustomers = () => API.get('/superadmin/customers')
export const createResortAdmin = (data) => API.post('/superadmin/resorts', data)
export const deleteResortAdmin = (id) => API.delete(`/superadmin/resorts/${id}`)


export const uploadInstructorImage = (formData) => API.post('/instructor/upload-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

export const getMySchool = () => API.get('/instructor/my-school')

export const getInstructorStats = (dateFrom, dateTo) => API.get(`/instructor/stats?dateFrom=${dateFrom}&dateTo=${dateTo || dateFrom}`)

export const getResorts = () => API.get('/customer/resorts')
export const getResortSchools = (resortId) => API.get(`/customer/resorts/${resortId}/schools`)

export const getSchoolInstructors = (schoolId) => API.get(`/customer/schools/${schoolId}/instructors`)
export const updateResortInfo = (data) => API.patch('/resort/info', data)

export const uploadResortMap = (formData) => API.post('/resort/upload-map', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const uploadResortGallery = (formData) => API.post('/resort/upload-gallery', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const deleteResortGalleryImage = (imagePath) => API.patch('/resort/gallery/delete', { imagePath })
export const setResortMainImage = (imagePath) => API.patch('/resort/set-main', { imagePath })

export const getResortInfo = (resortId) => API.get(`/customer/resorts/${resortId}/info`)

export const updateSchoolInfo = (data) => API.patch('/school/info', data)
export const uploadSchoolGallery = (formData) => API.post('/school/upload-gallery', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const deleteSchoolGalleryImage = (imagePath) => API.patch('/school/gallery/delete', { imagePath })
export const setSchoolMainImage = (imagePath) => API.patch('/school/set-main', { imagePath })

export const getSchoolInfo = (schoolId) => API.get(`/customer/schools/${schoolId}/info`)

export const updateInstructorInfo = (data) => API.patch('/instructor/info', data)

export const getInstructorAvailability = (instructorId, date) => API.get(`/customer/instructor/${instructorId}/availability?date=${date}`)

export const moveLesson = (id, data) => API.patch(`/lessons/${id}/move`, data)

export const lockOpenGroup = (id, data) => API.patch(`/lessons/${id}/lock-open-group`, data)

export const unassignInstructor = (id) => API.patch(`/lessons/${id}/unassign`)