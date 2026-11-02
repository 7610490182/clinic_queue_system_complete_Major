import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import {
  FiSearch,
  FiStar,
  FiClock,
  FiMapPin,
  FiAward,
  FiGrid,
  FiLayers,
  FiCheckCircle,
  FiPhone
} from 'react-icons/fi';
import {
  FaUserMd,
  FaHospital,
  FaHeartbeat,
  FaBone,
  FaFemale,
  FaBaby,
  FaStethoscope,
  FaEye,
  FaBrain
} from 'react-icons/fa';

// Specialty mapping to symptom search keywords
const symptomSpecialtyMap = {
  fever: ['physician', 'medicine', 'pediatric'],
  cough: ['physician', 'medicine', 'pediatric'],
  cold: ['physician', 'pediatric'],
  flu: ['physician'],
  heart: ['cardio'],
  chest: ['cardio'],
  bp: ['cardio', 'physician'],
  skin: ['derma'],
  acne: ['derma'],
  hair: ['derma'],
  rash: ['derma'],
  bone: ['ortho'],
  joint: ['ortho'],
  knee: ['ortho'],
  back: ['ortho', 'spine'],
  spine: ['ortho'],
  fracture: ['ortho'],
  child: ['pediatric'],
  kid: ['pediatric'],
  baby: ['pediatric'],
  women: ['gynec', 'obstet'],
  pregnancy: ['gynec', 'obstet'],
  delivery: ['gynec', 'obstet'],
  eye: ['ophthalm'],
  vision: ['ophthalm'],
  ear: ['ent'],
  nose: ['ent'],
  throat: ['ent'],
  sinus: ['ent'],
  brain: ['neuro'],
  nerve: ['neuro'],
  migraine: ['neuro', 'physician'],
  headache: ['neuro', 'physician'],
  diabetes: ['physician', 'medicine']
};

const specialtyHiNames = {
  'Cardiologist': 'कार्डियोलॉजिस्ट (हृदय रोग)',
  'Orthopedic Surgeon': 'ऑर्थोपेडिक सर्जन (हड्डी व जोड़)',
  'Obstetrician & Gynecologist': 'स्त्री एवं प्रसूति रोग',
  'Dermatologist': 'डर्मेटोलॉजिस्ट (त्वचा एवं सौंदर्य)',
  'Pediatrician': 'शिशु एवं बाल रोग',
  'General Physician': 'जनरल फिजिशियन (सामान्य चिकित्सा)',
  'Ophthalmologist': 'नेत्र रोग विशेषज्ञ (आई सर्जन)',
  'ENT Specialist': 'ईएनटी विशेषज्ञ (कान, नाक, गला)',
  'Neurologist': 'न्यूरोलॉजिस्ट (मस्तिष्क व तंत्रिका)'
};

const specialtyMetadata = {
  'Cardiologist': {
    icon: FaHeartbeat,
    color: 'from-rose-500 to-red-600',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
    description: 'Heart health, blood pressure, ECG/Echo & cardiovascular care',
    descriptionHi: 'हृदय स्वास्थ्य, रक्तचाप, ईसीजी/इको एवं कार्डियोवैस्कुलर देखभाल'
  },
  'Orthopedic Surgeon': {
    icon: FaBone,
    color: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    description: 'Joint replacement, spine disorders, sports trauma & bone fractures',
    descriptionHi: 'जोड़ों का प्रत्यारोपण, रीढ़ विकार, स्पोर्ट्स ट्रॉमा एवं फ्रैक्चर'
  },
  'Obstetrician & Gynecologist': {
    icon: FaFemale,
    color: 'from-pink-500 to-fuchsia-600',
    badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900',
    description: 'Maternity, prenatal wellness, laparoscopic surgery & women health',
    descriptionHi: 'मातृत्व, प्रसव पूर्व देखभाल, लेप्रोस्कोपिक सर्जरी एवं महिला स्वास्थ्य'
  },
  'Dermatologist': {
    icon: FaStethoscope,
    color: 'from-purple-500 to-indigo-600',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
    description: 'Skin diseases, hair restoration, clinical acne care & laser therapy',
    descriptionHi: 'त्वचा रोग, बाल झड़ने का इलाज, मुहांसों की थेरेपी एवं लेजर'
  },
  'Pediatrician': {
    icon: FaBaby,
    color: 'from-sky-500 to-blue-600',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900',
    description: 'Neonatal intensive care, pediatric immunization & infant wellness',
    descriptionHi: 'नवजात शिशु गहन देखभाल, बाल टीकाकरण एवं बाल स्वास्थ्य'
  },
  'General Physician': {
    icon: FaStethoscope,
    color: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    description: 'Internal medicine, infectious diseases, fever & chronic diabetes',
    descriptionHi: 'सामान्य चिकित्सा, संक्रामक रोग, मौसमी बुखार एवं मधुमेह'
  },
  'Ophthalmologist': {
    icon: FaEye,
    color: 'from-cyan-500 to-blue-600',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900',
    description: 'Cataract micro-surgery, retina treatment & refractive vision correction',
    descriptionHi: 'मोतियाबिंद माइक्रो-सर्जरी, रेटिना उपचार एवं दृष्टि सुधार'
  },
  'ENT Specialist': {
    icon: FaUserMd,
    color: 'from-indigo-500 to-violet-600',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
    description: 'Ear endoscopy, sinus microsurgery & throat vocal cord care',
    descriptionHi: 'कान की एंडोस्कोपी, साइनस माइक्रो-सर्जरी एवं गले का उपचार'
  },
  'Neurologist': {
    icon: FaBrain,
    color: 'from-violet-500 to-purple-600',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900',
    description: 'Neurological disorders, stroke rehabilitation, migraine & epilepsy',
    descriptionHi: 'मस्तिष्क एवं तंत्रिका विकार, स्ट्रोक पुनर्वास, माइग्रेन एवं मिर्गी'
  }
};

const DoctorCard = ({ doctor }) => {
  const { language, t } = useLanguage();
  const isHindi = language === 'hi';
  const [imageError, setImageError] = useState(false);
  const hasValidImage = Boolean(doctor.profileImage && doctor.profileImage.trim() !== '' && !imageError);
  const initials = doctor.name
    ? doctor.name
      .replace('Dr.', '')
      .trim()
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
    : 'DR';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg hover:shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 group">
      <div>
        {/* Card Header & Avatar Area - Clickable to open Doctor Profile */}
        <Link
          to={`/doctor/${doctor._id}`}
          className="block relative h-56 bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer group/header"
          title={`Click to view ${doctor.name}'s profile & Google Map`}
        >
          {hasValidImage ? (
            <img
              src={doctor.profileImage}
              alt={doctor.name}
              onError={() => setImageError(true)}
              className="object-cover w-full h-full group-hover:scale-105 transition duration-500"
            />
          ) : (
            // Clean modern doctor avatar card when profileImage is empty (as requested)
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 p-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-blue-500/20 border-2 border-blue-400/30 flex items-center justify-center mb-2.5 text-blue-300 shadow-lg group-hover:scale-110 transition duration-300">
                <span className="text-2xl font-black tracking-wider text-blue-300">{initials}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] font-semibold text-blue-200">
                <FaUserMd className="text-xs" /> {isHindi ? 'प्रमाणित चिकित्सक' : 'Verified Practitioner'}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Gwalior, Madhya Pradesh</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

          {/* Rating Badge */}
          <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-slate-900 dark:text-white shadow-md flex items-center gap-1.5">
            <FiStar className="text-amber-500 fill-amber-500" />
            <span>{doctor.rating?.toFixed(1) || '4.8'}</span>
            <span className="text-slate-400 font-normal">({doctor.reviewCount || 120})</span>
          </div>

          {/* Available Status */}
          <div className="absolute top-4 right-4 bg-emerald-500/95 text-white px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>{isHindi ? 'उपलब्ध' : 'Available'}</span>
          </div>

          {/* Bottom Title on Image */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 block truncate">
              {isHindi ? (specialtyHiNames[doctor.specialization] || doctor.specialization) : doctor.specialization}
            </span>
            <h3 className="text-xl font-black text-white leading-tight truncate group-hover/header:text-blue-300 transition">
              {doctor.name}
            </h3>
          </div>
        </Link>

        {/* Details Body */}
        <div className="p-6 space-y-3.5">
          {doctor.clinic && (
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 flex items-start gap-2">
              <FaHospital className="text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{doctor.clinic}</span>
            </p>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <FiAward className="text-indigo-500 flex-shrink-0" />
            <span>
              {isHindi ? 'चिकित्सीय अनुभव:' : 'Clinical Experience:'}{' '}
              <strong className="text-slate-900 dark:text-white">
                {doctor.experience} {isHindi ? 'वर्ष' : 'years'}
              </strong>
            </span>
          </p>

          {doctor.timings && (
            <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <FiClock className="text-amber-500 flex-shrink-0" />
              <span>
                {isHindi ? 'क्लिनिक समय:' : 'Chamber Hours:'}{' '}
                <strong className="text-slate-900 dark:text-white">
                  {doctor.timings.start} – {doctor.timings.end}
                </strong>
              </span>
            </p>
          )}

          {doctor.address && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <FiMapPin className="text-rose-500 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{doctor.address}</span>
            </p>
          )}

          {/* Weekly Available Days */}
          {doctor.availableDays && doctor.availableDays.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                {isHindi ? 'सप्ताह के परामर्श दिन:' : 'Weekly Chamber Days:'}
              </span>
              <div className="flex flex-wrap gap-1">
                {doctor.availableDays.map((day) => (
                  <span
                    key={day}
                    className="bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100 dark:border-slate-700"
                  >
                    {day.slice(0, 3)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-6 pt-0 space-y-2">
        <Link
          to={`/doctor/${doctor._id}`}
          className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold py-2.5 px-4 rounded-2xl block text-center text-xs border border-slate-200 dark:border-slate-700 transition duration-200 flex items-center justify-center gap-1.5"
        >
          <span>👤 {t('viewDetailsMap') || 'View Details & Google Map'}</span>
          <span className="text-[11px]">→</span>
        </Link>
        <Link
          to={`/book/${doctor._id}`}
          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-2.5 px-4 rounded-2xl block text-center text-xs shadow-lg shadow-blue-500/25 transition duration-200"
        >
          📅 {t('bookQueuedAppointment') || 'Book Queued Appointment'}
        </Link>
      </div>
    </div>
  );
};

const DoctorList = () => {
  const { language, t } = useLanguage();
  const isHindi = language === 'hi';
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'grid'

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get('/api/doctors');
      const data = res.data;
      setDoctors(Array.isArray(data) ? data : (data?.doctors || []));
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const keyword = searchText.trim().toLowerCase();
    const specialization = (doctor.specialization || '').toLowerCase();
    const name = (doctor.name || '').toLowerCase();
    const clinic = (doctor.clinic || '').toLowerCase();
    const address = (doctor.address || '').toLowerCase();

    let matchesProblem = true;
    if (keyword) {
      const matchesDirect =
        specialization.includes(keyword) ||
        name.includes(keyword) ||
        clinic.includes(keyword) ||
        address.includes(keyword);

      const matchedSpecialties = Object.entries(symptomSpecialtyMap).find(([symptom]) =>
        keyword.includes(symptom) || symptom.includes(keyword)
      );
      const matchesSymptom = matchedSpecialties
        ? matchedSpecialties[1].some((spec) => specialization.includes(spec))
        : false;

      matchesProblem = matchesDirect || matchesSymptom;
    }

    const matchesSpecialization = specializationFilter
      ? specialization.includes(specializationFilter.toLowerCase())
      : true;

    return matchesProblem && matchesSpecialization;
  });

  // Extract distinct specializations from dataset
  const distinctSpecializations = Array.from(
    new Set(doctors.map((d) => d.specialization).filter(Boolean))
  );

  // Group filtered doctors by specialization
  const groupedDoctors = distinctSpecializations.reduce((acc, spec) => {
    const matched = filteredDoctors.filter((d) => d.specialization === spec);
    if (matched.length > 0) {
      acc[spec] = matched;
    }
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:text-slate-300">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-lg font-bold">
            {isHindi ? 'सत्यापित ग्वालियर डॉक्टरों की सूची लोड हो रही है...' : 'Loading verified Gwalior doctors...'}
          </div>
          <p className="text-xs text-slate-400">
            {isHindi ? 'विशेषज्ञ क्लिनिक और समय सारिणी प्राप्त की जा रही है' : 'Fetching specialist chambers & clinical timings'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-wider">
          <FiMapPin className="text-rose-500" />{' '}
          {isHindi ? 'ग्वालियर, मध्य प्रदेश • प्रमाणित विशेषज्ञ' : 'Gwalior, Madhya Pradesh • Certified Specialists'}
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('findSpecialistInGwalior')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl mx-auto">
          {t('doctorSearchSubtitle')}
        </p>
      </div>

      {/* Search & Specialization Quick Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <FiSearch className="absolute left-4 top-3.5 text-slate-400 text-lg" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-4 flex items-center gap-2">
            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">{t('allSpecializations')} ({doctors.length})</option>
              {distinctSpecializations.map((spec) => {
                const count = doctors.filter((d) => d.specialization === spec).length;
                const displayName = isHindi ? (specialtyHiNames[spec] || spec) : spec;
                return (
                  <option key={spec} value={spec}>
                    {displayName} ({count})
                  </option>
                );
              })}
            </select>

            {/* View Mode Switcher */}
            <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`p-2.5 rounded-xl transition ${viewMode === 'grouped'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                title={isHindi ? 'विशेषज्ञता अनुसार समूहबद्ध' : 'Group by Specialization'}
              >
                <FiLayers className="text-base" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-xl transition ${viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                title={isHindi ? 'ग्रिड दृश्य' : 'All Grid View'}
              >
                <FiGrid className="text-base" />
              </button>
            </div>
          </div>
        </div>

        {/* Specialization Category Pills */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <span>{t('specializationDisciplines')}:</span>
            {(searchText || specializationFilter) && (
              <button
                onClick={() => {
                  setSearchText('');
                  setSpecializationFilter('');
                }}
                className="text-red-500 hover:underline font-bold text-[11px]"
              >
                {t('resetFilters')}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSpecializationFilter('')}
              className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 ${specializationFilter === ''
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              <span>{t('allSpecialists')}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {doctors.length}
              </span>
            </button>

            {distinctSpecializations.map((spec) => {
              const count = doctors.filter((d) => d.specialization === spec).length;
              const isSelected = specializationFilter === spec;
              const meta = specialtyMetadata[spec] || {};
              const IconComp = meta.icon || FaUserMd;
              const displayName = isHindi ? (specialtyHiNames[spec] || spec) : spec;

              return (
                <button
                  key={spec}
                  onClick={() => setSpecializationFilter(isSelected ? '' : spec)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 border ${isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                >
                  <IconComp className={`text-xs ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                  <span>{displayName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Locality Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-1">
            {isHindi ? 'ग्वालियर के प्रमुख इलाके:' : 'Gwalior Localities:'}
          </span>
          {['Lashkar', 'Morar', 'Thatipur', 'City Center', 'Govindpuri', 'Shinde Ki Chhawani'].map(
            (loc) => (
              <button
                key={loc}
                onClick={() => setSearchText(loc)}
                className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition border border-slate-200 dark:border-slate-700 font-medium"
              >
                📍 {loc}
              </button>
            )
          )}
        </div>
      </div>

      {/* No Specialists Found */}
      {filteredDoctors.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {isHindi ? 'आपकी खोज के अनुसार कोई डॉक्टर नहीं मिला' : 'No specialists match your search'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            {isHindi
              ? 'कृपया "Lashkar", "Cardio", "Ortho" खोजें या ऊपर "सभी फ़िल्टर हटाएं" पर क्लिक करें।'
              : 'Try searching for "Lashkar", "Cardio", "Ortho", or click "Reset All Filters" above.'}
          </p>
          <button
            onClick={() => {
              setSearchText('');
              setSpecializationFilter('');
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700"
          >
            {isHindi ? 'सभी ग्वालियर डॉक्टर देखें' : 'Show All Gwalior Doctors'}
          </button>
        </div>
      )}

      {/* VIEW MODE 1: Grouped According to Specialization */}
      {viewMode === 'grouped' && !specializationFilter && filteredDoctors.length > 0 && (
        <div className="space-y-12">
          {Object.entries(groupedDoctors).map(([specialization, docList]) => {
            const meta = specialtyMetadata[specialization] || {};
            const IconComp = meta.icon || FaUserMd;
            const displayName = isHindi ? (specialtyHiNames[specialization] || specialization) : specialization;
            const desc = isHindi ? (meta.descriptionHi || meta.description) : meta.description;

            return (
              <section key={specialization} className="space-y-5">
                {/* Specialization Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-blue-500/20 dark:border-blue-500/30 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                      <IconComp className="text-lg" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                          {displayName}
                        </h2>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          {docList.length} {isHindi ? 'डॉक्टर' : docList.length === 1 ? 'Doctor' : 'Doctors'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {desc}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSpecializationFilter(specialization)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>{isHindi ? `सभी ${displayName} देखें` : `Filter only ${specialization}`}</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Doctor Cards Grid for this Specialization */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {docList.map((doctor) => (
                    <DoctorCard key={doctor._id} doctor={doctor} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: Unified Flat Grid */}
      {(viewMode === 'grid' || specializationFilter) && filteredDoctors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {isHindi ? 'कुल' : 'Showing'} <strong className="text-slate-800 dark:text-white">{filteredDoctors.length}</strong> {isHindi ? 'विशेषज्ञ डॉक्टर मिले' : 'specialists'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorList;
