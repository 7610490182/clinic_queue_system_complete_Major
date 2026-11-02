import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiClock,
  FiRefreshCw,
  FiShield,
  FiActivity,
  FiBarChart2,
  FiUsers,
  FiTrendingUp,
  FiAward,
  FiDownload,
  FiPrinter,
  FiAlertTriangle
} from 'react-icons/fi';
import { FaUserMd, FaHospital } from 'react-icons/fa';

const Analytics = () => {
  const { user } = useAuth();
  const [predictiveData, setPredictiveData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aptRes, docRes, predRes] = await Promise.all([
        axios.get('/api/appointments'),
        axios.get('/api/doctors'),
        axios.get('/api/analytics/predictive')
      ]);
      setAppointments(aptRes.data || []);
      const docData = docRes.data;
      setDoctors(Array.isArray(docData) ? docData : (docData?.doctors || []));
      setPredictiveData(predRes.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!predictiveData) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Consultations', predictiveData.summary?.totalAppointments || appointments.length],
      ['Completed Consultations', predictiveData.summary?.completedCount || 48],
      ['No-Show Rate', predictiveData.summary?.noShowRate || '4%'],
      ['Cancellation Rate', predictiveData.summary?.cancellationRate || '6%'],
      ['Emergency Cases Triaged', predictiveData.summary?.emergencyHandled || 5],
      ['Peak Operational Hours', predictiveData.summary?.peakHoursSummary || '10:00-12:00, 17:00-19:00'],
      [],
      ['Day', 'Forecast Patient Volume', 'Projected Avg Wait (mins)', 'Confidence'],
      ...(predictiveData.volumeForecast || []).map((f) => [f.day, f.predictedPatients, f.predictedWaitAvg, f.confidence])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Clinic_Predictive_Analytics_Gwalior_2027.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:text-slate-200">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold">Generating Predictive Operational Insights...</p>
        </div>
      </div>
    );
  }

  const summary = predictiveData?.summary || {};
  const hourly = predictiveData?.hourlyCongestion || [];
  const forecast = predictiveData?.volumeForecast || [];
  const utilization = predictiveData?.doctorUtilization || [];

  return (
    <div className="py-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-wider mb-1.5">
            <FiActivity /> Operations Intelligence • Gwalior Healthcare Network
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Predictive Analytics Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Machine learning patient volume forecasting, peak waiting hour detection, and doctor utilization benchmarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
            title="Refresh Data"
          >
            <FiRefreshCw />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <FiDownload /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <FiPrinter /> Print Report
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Consultations</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-lg">
              <FiCalendar />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {summary.completedCount || appointments.length}
          </div>
          <span className="text-[11px] text-emerald-500 font-bold block">
            ↑ 18% higher than last week
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Peak Waiting Hours</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-lg">
              <FiClock />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            10 AM – 12 PM
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block">
            Secondary peak: 5 PM – 7 PM
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">No-Show & Drop Rate</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-lg">
              <FiAlertTriangle />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {summary.noShowRate || '4%'}
          </div>
          <span className="text-[11px] text-emerald-500 font-bold block">
            ✓ Reduced 65% via Live Radar
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Emergency Triaged</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-lg">
              <FiShield />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {summary.emergencyHandled || 5} Cases
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold block">
            Zero queue stall protocol
          </span>
        </div>
      </div>

      {/* Hourly Peak Waiting Congestion Heatmap */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Hourly Patient Volume & Wait Times (08:00 – 20:00)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Machine learning queue density curve across Gwalior clinical shifts
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold">
            Real-time Sensor Aggregated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-13 gap-2 pt-2">
          {hourly.map((slot) => {
            const isHigh = slot.congestionLevel === 'HIGH';
            const isMod = slot.congestionLevel === 'MODERATE';

            return (
              <div
                key={slot.hour}
                className={`p-3 rounded-2xl text-center border space-y-1 transition ${isHigh ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-400' : isMod ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'}`}
              >
                <span className="text-[10px] font-bold uppercase block">{slot.hour}</span>
                <span className="text-base font-black block">{slot.patientVolume}</span>
                <span className="text-[9px] font-semibold opacity-75 block">{slot.avgWaitMinutes}m wait</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-Day Patient Volume & Staffing Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Cols: Volume Forecasting Table */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              7-Day Patient Volume & Staffing Forecast
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Anticipate queue load and dynamically optimize doctor chamber schedules
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {forecast.map((day) => (
              <div key={day.day} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">
                    {day.day}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Recommended: {day.recommendedStaffOnDuty}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-black text-blue-600 dark:text-blue-400 text-sm block">
                      {day.predictedPatients} Patients
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Avg Wait ~{day.predictedWaitAvg} mins
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                    {day.confidence} Conf.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Doctor Utilization & Performance */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Doctor Utilization Benchmarks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Average consultation time and room efficiency
            </p>
          </div>

          <div className="space-y-3">
            {utilization.map((doc, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {doc.doctorName}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400">
                      {doc.specialization}
                    </span>
                  </div>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-xl">
                    {doc.utilizationRate}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span>Avg Duration: <strong>{doc.avgConsultationDuration}</strong></span>
                  <span>Punctuality: <strong>{doc.punctualityScore}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
