import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import AuditLogViewer from '../components/AuditLogViewer';
import PasswordInput from '../components/PasswordInput';
import { getSocketUrl } from '../config';
const AdminDashboard = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [queue, setQueue] = useState([]);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    specialization: '',
    email: '',
    phone: '',
    password: '',
    experience: '',
    startTime: '',
    endTime: '',
    availableDays: []
  });
  const [patientForm, setPatientForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    appointmentId: '',
    doctorId: '',
    date: '',
    time: ''
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const socketUrl = getSocketUrl();
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'dark:bg-slate-700 dark:text-slate-200 bg-slate-100 text-slate-800';
      case 'confirmed': return 'dark:bg-blue-900 dark:text-blue-200 bg-blue-100 text-blue-800';
      case 'checked_in': return 'dark:bg-cyan-900 dark:text-cyan-200 bg-cyan-100 text-cyan-800';
      case 'in_queue': return 'dark:bg-yellow-900 dark:text-yellow-200 bg-yellow-100 text-yellow-800';
      case 'consulting': return 'dark:bg-orange-900 dark:text-orange-200 bg-orange-100 text-orange-800';
      case 'completed': return 'dark:bg-green-900 dark:text-green-200 bg-green-100 text-green-800';
      case 'cancelled': return 'dark:bg-red-900 dark:text-red-200 bg-red-100 text-red-800';
      case 'booked': return 'dark:bg-blue-900 dark:text-blue-200 bg-blue-100 text-blue-800';
      case 'waiting': return 'dark:bg-yellow-900 dark:text-yellow-200 bg-yellow-100 text-yellow-800';
      case 'ongoing': return 'dark:bg-orange-900 dark:text-orange-200 bg-orange-100 text-orange-800';
      default: return 'dark:bg-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200';
    }
  };
  const fetchDoctors = async () => {
    try {
      const res = await axios.get('/api/doctors');
      const data = res.data;
      setDoctors(Array.isArray(data) ? data : (data?.doctors || []));
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };
  const fetchAppointments = async () => {
    try {
      const res = await axios.get('/api/appointments');
      setAppointments(res.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };
  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get('/api/records/audit-logs');
      setAuditLogs(res.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };
  const handleToggleDoctorStatus = async (id, currentStatus) => {
    try {
      await axios.patch(`/api/doctors/${id}/status`, { isActive: !currentStatus });
      fetchDoctors();
      fetchAuditLogs();
    } catch (error) {
      console.error('Error toggling doctor status:', error);
      alert(error.response?.data?.message || 'Failed to update doctor status');
    }
  };
  const handleTogglePatientStatus = async (id, currentStatus) => {
    try {
      await axios.patch(`/api/users/${id}/status`, { isActive: !currentStatus });
      fetchPatients();
      fetchAuditLogs();
    } catch (error) {
      console.error('Error toggling patient status:', error);
      alert(error.response?.data?.message || 'Failed to update patient status');
    }
  };
  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/users');
      setPatients(res.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };
  const fetchQueue = useCallback(async () => {
    if (!selectedDoctor || !selectedDate) return;
    try {
      const res = await axios.get(`/api/appointments/queue/${selectedDoctor}/${selectedDate}`);
      setQueue(res.data);
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  }, [selectedDoctor, selectedDate]);
  useEffect(() => {
    fetchDoctors();
    fetchPatients();
    fetchAppointments();
    fetchAuditLogs();
  }, []);
  useEffect(() => {
    const socket = io(socketUrl);
    socket.on('appointmentUpdate', () => {
      fetchAppointments();
    fetchAuditLogs();
      if (selectedDoctor && selectedDate) {
        fetchQueue();
      }
    });
    return () => socket.close();
  }, [selectedDoctor, selectedDate, socketUrl, fetchQueue]);
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchQueue();
    }
  }, [selectedDoctor, selectedDate, fetchQueue]);
  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    try {
      const doctorData = {
        ...doctorForm,
        experience: parseInt(doctorForm.experience, 10),
        timings: {
          start: doctorForm.startTime,
          end: doctorForm.endTime
        }
      };
      if (editingDoctor) {
        await axios.put(`/api/doctors/${editingDoctor}`, doctorData);
        setEditingDoctor(null);
      } else {
        await axios.post('/api/doctors', doctorData);
      }
      setShowAddDoctor(false);
      setDoctorForm({
        name: '',
        specialization: '',
        email: '',
        phone: '',
        password: '',
        experience: '',
        startTime: '',
        endTime: '',
        availableDays: []
      });
      fetchDoctors();
    } catch (error) {
      console.error('Error saving doctor:', error);
    }
  };
  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPatient) {
        await axios.put(`/api/users/${selectedPatient._id}`, {
          name: patientForm.name,
          email: patientForm.email,
          phone: patientForm.phone
        });
        setSelectedPatient(null);
      } else {
        await axios.post('/api/auth/register', {
          ...patientForm,
          role: 'patient'
        });
      }
      setShowAddPatient(false);
      setPatientForm({ name: '', email: '', phone: '', password: '' });
      fetchPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };
  const handleDeleteDoctor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;
    try {
      await axios.delete(`/api/doctors/${id}`);
      fetchDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
    }
  };
  const handleDeletePatient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    try {
      await axios.delete(`/api/users/${id}`);
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };
  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await axios.put(`/api/appointments/${appointmentId}/status`, { status });
      fetchQueue();
      fetchAppointments();
    fetchAuditLogs();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/appointments/${rescheduleData.appointmentId}/reschedule`, {
        doctorId: rescheduleData.doctorId,
        date: rescheduleData.date,
        time: rescheduleData.time
      });
      alert('Appointment rescheduled successfully!');
      setRescheduleData({ appointmentId: '', doctorId: '', date: '', time: '' });
      fetchAppointments();
    fetchAuditLogs();
      if (selectedDoctor && selectedDate) fetchQueue();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      alert(error.response?.data?.message || 'Failed to reschedule appointment');
    }
  };
  const handleDayToggle = (day) => {
    setDoctorForm(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };
  const totalPatients = patients.length;
  const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
  const totalEarnings = appointments
    .filter(apt => apt.payment?.status === 'paid')
    .reduce((sum, apt) => sum + (apt.payment?.amount || 0), 0);
  const averageWaitTime = Math.round(
    appointments.reduce((sum, apt) => sum + (apt.estimatedWaitTime || 0), 0) /
    (appointments.filter(apt => apt.estimatedWaitTime).length || 1)
  );
  const currentToken = queue.find(a => ['consulting', 'in_queue'].includes(a.status))?.tokenNumber || 'N/A';
  const nextToken = queue.find(a => ['confirmed', 'checked_in'].includes(a.status))?.tokenNumber || 'N/A';
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-blue-100 text-lg">Welcome back, {user?.name || 'Administrator'}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{new Date().toLocaleDateString()}</div>
              <div className="text-blue-200">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-sm text-gray-500">Total Patients</p>
            <p className="text-3xl font-bold text-blue-600">{totalPatients}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-sm text-gray-500">Completed Appointments</p>
            <p className="text-3xl font-bold text-green-600">{completedAppointments}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-sm text-gray-500">Total Earnings</p>
            <p className="text-3xl font-bold text-green-600">₹{totalEarnings}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-sm text-gray-500">Average Wait Time</p>
            <p className="text-3xl font-bold text-indigo-600">{averageWaitTime}m</p>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Doctors</h2>
              <button
                onClick={() => {
                  setShowAddDoctor(prev => !prev);
                  if (!showAddDoctor) {
                    setEditingDoctor(null);
                    setDoctorForm({ name: '', specialization: '', email: '', phone: '', password: '', experience: '', startTime: '', endTime: '', availableDays: [] });
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                {showAddDoctor ? 'Close' : 'Add Doctor'}
              </button>
            </div>
            {showAddDoctor && (
              <form onSubmit={handleDoctorSubmit} className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    className="px-3 py-2 border rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Specialization"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    className="px-3 py-2 border rounded"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    className="px-3 py-2 border rounded"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="10-digit Phone"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} maxLength={10} inputMode="numeric" pattern="[0-9]{10}" 
                    className="px-3 py-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Experience (years)"
                    value={doctorForm.experience}
                    onChange={(e) => setDoctorForm({ ...doctorForm, experience: e.target.value })}
                    className="px-3 py-2 border rounded"
                    required
                  />
                  <PasswordInput
                    placeholder="Leave blank to keep default/password unchanged"
                    value={doctorForm.password}
                    onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                    className="px-3 py-2 border rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1 col-span-full">
                    When creating a new doctor, leave this blank to use the default password <strong>doctor123</strong>.
                  </p>
                  <div className="flex space-x-2">
                    <input
                      type="time"
                      value={doctorForm.startTime}
                      onChange={(e) => setDoctorForm({ ...doctorForm, startTime: e.target.value })}
                      className="px-3 py-2 border rounded flex-1"
                      required
                    />
                    <span className="self-center">to</span>
                    <input
                      type="time"
                      value={doctorForm.endTime}
                      onChange={(e) => setDoctorForm({ ...doctorForm, endTime: e.target.value })}
                      className="px-3 py-2 border rounded flex-1"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="mb-2 font-medium">Available Days:</p>
                  <p className="text-sm text-gray-500 mb-2">
                    Leave password blank when editing a doctor to preserve the existing login password.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={doctorForm.availableDays.includes(day)}
                          onChange={() => handleDayToggle(day)}
                          className="mr-2"
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                  {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                </button>
              </form>
            )}
            <div className="space-y-3">
              {doctors.map(doctor => (
                <div key={doctor._id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{doctor.name}</p>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${doctor.isActive !== false ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                        {doctor.isActive !== false ? 'Active' : 'Deactivated'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{doctor.specialization}</p>
                    <p className="text-sm text-gray-500">{doctor.timings?.start} - {doctor.timings?.end}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                    <button
                      onClick={() => handleToggleDoctorStatus(doctor._id, doctor.isActive !== false)}
                      className={`px-3 py-1 rounded text-sm font-bold text-white transition ${doctor.isActive !== false ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >
                      {doctor.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingDoctor(doctor._id);
                        setShowAddDoctor(true);
                        setDoctorForm({
                          name: doctor.name,
                          specialization: doctor.specialization,
                          email: doctor.email,
                          phone: doctor.phone || '',
                          password: '',
                          experience: doctor.experience || '',
                          startTime: doctor.timings?.start || '09:00',
                          endTime: doctor.timings?.end || '17:00',
                          availableDays: doctor.availableDays || []
                        });
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDoctor(doctor._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {doctors.length === 0 && (
                <p className="text-gray-500">No doctors available.</p>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Patient Management</h2>
              <button
                onClick={() => {
                  setShowAddPatient(prev => !prev);
                  if (!showAddPatient) {
                    setSelectedPatient(null);
                    setPatientForm({ name: '', email: '', phone: '', password: '' });
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                {showAddPatient ? 'Close' : 'Add Patient'}
              </button>
            </div>
            {showAddPatient && (
              <form onSubmit={handlePatientSubmit} className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded">
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={patientForm.name}
                    onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                    className="px-3 py-2 border rounded"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={patientForm.email}
                    onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                    className="px-3 py-2 border rounded"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="10-digit Phone"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} maxLength={10} inputMode="numeric" pattern="[0-9]{10}" 
                    className="px-3 py-2 border rounded"
                  />
                  {!selectedPatient && (
                    <PasswordInput
                      placeholder="Password"
                      value={patientForm.password}
                      onChange={(e) => setPatientForm({ ...patientForm, password: e.target.value })}
                      className="px-3 py-2 border rounded"
                      required
                    />
                  )}
                </div>
                <button type="submit" className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                  {selectedPatient ? 'Update Patient' : 'Create Patient'}
                </button>
              </form>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length > 0 ? patients.map(patient => (
                    <tr key={patient._id} className="border-b">
                      <td className="px-4 py-3">{patient.name}</td>
                      <td className="px-4 py-3">{patient.email}</td>
                      <td className="px-4 py-3">{patient.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${patient.isActive !== false ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                          {patient.isActive !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleTogglePatientStatus(patient._id, patient.isActive !== false)}
                          className={`px-3 py-1 rounded text-sm font-bold text-white transition ${patient.isActive !== false ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                          {patient.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setShowAddPatient(true);
                            setPatientForm({ name: patient.name, email: patient.email, phone: patient.phone || '', password: '' });
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePatient(patient._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-gray-500">No patients found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Queue Monitoring</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">Today&apos;s Appointments</p>
              <p className="text-3xl font-bold text-blue-700">{appointments.length}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-500">Waiting Patients</p>
              <p className="text-3xl font-bold text-yellow-700">{appointments.filter(apt => ['pending', 'confirmed', 'checked_in', 'in_queue', 'booked', 'waiting', 'ongoing'].includes(apt.status)).length}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500">Average Wait</p>
              <p className="text-3xl font-bold text-green-700">{averageWaitTime}m</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="px-3 py-2 border rounded w-full md:w-1/2"
            >
              <option value="">Select Doctor</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>{doctor.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded w-full md:w-1/2"
            />
          </div>
          {selectedDoctor ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-sm text-gray-600">Current Token</p>
                  <p className="text-4xl font-bold text-indigo-700">{currentToken}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-sm text-gray-600">Next Token</p>
                  <p className="text-4xl font-bold text-indigo-700">{nextToken}</p>
                </div>
              </div>
              {queue.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No appointments in queue.</p>
              ) : (
                <div className="space-y-3">
                  {queue.map(appointment => (
                    <div key={appointment._id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border">
                      <div>
                        <p className="font-semibold">Token #{appointment.tokenNumber}</p>
                        <p className="text-sm text-gray-600">{appointment.patient?.name || 'Unknown patient'}</p>
                        <p className="text-sm text-gray-500">{appointment.time}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                        {appointment.status === 'pending' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Confirm
                          </button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'in_queue')}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Add to Queue
                          </button>
                        )}
                        {appointment.status === 'in_queue' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'consulting')}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Start Consulting
                          </button>
                        )}
                        {appointment.status === 'consulting' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setRescheduleData({
                            appointmentId: appointment._id,
                            doctorId: appointment.doctor?._id || appointment.doctor || selectedDoctor,
                            date: new Date(appointment.date).toISOString().split('T')[0],
                            time: appointment.time
                          })}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500">Choose a doctor and date to view queue details.</p>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Appointment Management</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Patient</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Doctor</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length > 0 ? appointments.map(appointment => (
                  <tr key={appointment._id} className="border-b">
                    <td className="px-4 py-3">{appointment.patient?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">{appointment.doctor?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3">{`${new Date(appointment.date).toLocaleDateString()} ${appointment.time}`}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setRescheduleData({
                          appointmentId: appointment._id,
                          doctorId: appointment.doctor?._id || '',
                          date: new Date(appointment.date).toISOString().split('T')[0],
                          time: appointment.time
                        })}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Reschedule
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-gray-500">No appointments scheduled.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {rescheduleData.appointmentId && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Reschedule Appointment</h2>
            <form onSubmit={handleRescheduleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={rescheduleData.doctorId}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, doctorId: e.target.value }))}
                className="px-3 py-2 border rounded"
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map(doc => (
                  <option key={doc._id} value={doc._id}>{doc.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={rescheduleData.date}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                className="px-3 py-2 border rounded"
                required
              />
              <input
                type="time"
                value={rescheduleData.time}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                className="px-3 py-2 border rounded"
                required
              />
              <div className="flex items-center gap-3">
                <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Save</button>
                <button
                  type="button"
                  onClick={() => setRescheduleData({ appointmentId: '', doctorId: '', date: '', time: '' })}
                  className="bg-gray-300 hover:bg-gray-400 text-slate-800 dark:text-slate-200 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        {/* Healthcare Security & Compliance Audit Log */}
        <AuditLogViewer />
      </div>
    </div>
  );
};
export default AdminDashboard;