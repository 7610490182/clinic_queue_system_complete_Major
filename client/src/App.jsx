import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LoginSelector from './pages/LoginSelector';
import PatientLogin from './pages/PatientLogin';
import DoctorLogin from './pages/DoctorLogin';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import RegisterSelector from './pages/RegisterSelector';
import PatientRegister from './pages/PatientRegister';
import DoctorRegister from './pages/DoctorRegister';
import AdminRegister from './pages/AdminRegister';
import DoctorList from './pages/DoctorList';
import DoctorProfile from './pages/DoctorProfile';
import BookAppointment from './pages/BookAppointment';
import MyAppointments from './pages/MyAppointments';
import TrackToken from './pages/TrackToken';
import PatientProfile from './pages/PatientProfile';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Analytics from './pages/Analytics';
import ForgotPassword from './pages/ForgotPassword';
import ReceptionCheckIn from './pages/ReceptionCheckIn';
import TelemedicineRoom from './pages/TelemedicineRoom';
import HealthTimeline from './pages/HealthTimeline';
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
            <Navbar darkMode={darkMode} toggleDarkMode={() => setDarkMode(prev => !prev)} />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginSelector />} />
                <Route path="/login/patient" element={<div className="container mx-auto px-4 py-8"><PatientLogin /></div>} />
                <Route path="/login/doctor" element={<div className="container mx-auto px-4 py-8"><DoctorLogin /></div>} />
                <Route path="/login/admin" element={<div className="container mx-auto px-4 py-8"><AdminLogin /></div>} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/register" element={<div className="container mx-auto px-4 py-8"><RegisterSelector /></div>} />
                <Route path="/register/general" element={<div className="container mx-auto px-4 py-8"><Register /></div>} />
                <Route path="/register/patient" element={<div className="container mx-auto px-4 py-8"><PatientRegister /></div>} />
                <Route path="/register/doctor" element={<div className="container mx-auto px-4 py-8"><DoctorRegister /></div>} />
                <Route path="/register/admin" element={<div className="container mx-auto px-4 py-8"><AdminRegister /></div>} />
                <Route path="/doctors" element={<div className="container mx-auto px-4 py-8"><DoctorList /></div>} />
                <Route path="/doctor/:doctorId" element={<div className="container mx-auto px-4 py-8"><DoctorProfile /></div>} />
                <Route path="/doctor/:id" element={<div className="container mx-auto px-4 py-8"><DoctorProfile /></div>} />
                <Route path="/doctors/:doctorId" element={<div className="container mx-auto px-4 py-8"><DoctorProfile /></div>} />
                <Route path="/doctors/:id" element={<div className="container mx-auto px-4 py-8"><DoctorProfile /></div>} />
                <Route path="/track-token" element={<TrackToken />} />
                <Route path="/reception-checkin" element={<ReceptionCheckIn />} />
                <Route path="/telemedicine/:appointmentId" element={
                  <ProtectedRoute>
                    <TelemedicineRoom />
                  </ProtectedRoute>
                } />
                <Route path="/health-records" element={
                  <ProtectedRoute>
                    <HealthTimeline />
                  </ProtectedRoute>
                } />
                <Route path="/book/:doctorId" element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <div className="container mx-auto px-4 py-8"><BookAppointment /></div>
                  </ProtectedRoute>
                } />

                {/* Patient Routes */}
                <Route path="/patient" element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <div className="container mx-auto px-4 py-8"><MyAppointments /></div>
                  </ProtectedRoute>
                } />
                <Route path="/patient/dashboard" element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <div className="container mx-auto px-4 py-8"><MyAppointments /></div>
                  </ProtectedRoute>
                } />
                <Route path="/patient/appointments" element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <div className="container mx-auto px-4 py-8"><MyAppointments /></div>
                  </ProtectedRoute>
                } />
                <Route path="/patient/profile" element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientProfile />
                  </ProtectedRoute>
                } />
                <Route path="/my-appointments" element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <div className="container mx-auto px-4 py-8"><MyAppointments /></div>
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <PatientProfile />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <div className="container mx-auto px-4 py-8"><AdminDashboard /></div>
                  </ProtectedRoute>
                } />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <div className="container mx-auto px-4 py-8"><AdminDashboard /></div>
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="/admin/analytics" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Analytics />
                  </ProtectedRoute>
                } />

                {/* Doctor Routes */}
                <Route path="/doctor" element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <div className="container mx-auto px-4 py-8"><DoctorDashboard /></div>
                  </ProtectedRoute>
                } />
                <Route path="/doctor/dashboard" element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <div className="container mx-auto px-4 py-8"><DoctorDashboard /></div>
                  </ProtectedRoute>
                } />
                <Route path="/doctor-dashboard" element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <div className="container mx-auto px-4 py-8"><DoctorDashboard /></div>
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            {/* Global Floating AI Healthcare Chatbot */}
            <Chatbot />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
