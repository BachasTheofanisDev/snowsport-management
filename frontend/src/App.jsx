import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import ResortDashboard from './pages/ResortDashboard'
import SchoolDashboard from './pages/SchoolDashboard'
import InstructorDashboard from './pages/InstructorDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Register from './pages/Register'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/resort" element={
          <ProtectedRoute allowedRoles={['resort']}>
            <ResortDashboard />
          </ProtectedRoute>
        } />
        <Route path="/school" element={
          <ProtectedRoute allowedRoles={['school']}>
            <SchoolDashboard />
          </ProtectedRoute>
        } />
        <Route path="/instructor" element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <InstructorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/customer" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App