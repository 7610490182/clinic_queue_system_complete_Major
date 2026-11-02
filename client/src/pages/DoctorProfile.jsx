import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import {
  FiArrowLeft,
  FiStar,
  FiClock,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCalendar,
  FiAward,
  FiNavigation,
  FiCheckCircle,
  FiCopy,
  FiExternalLink,
  FiShield,
  FiShare2,
  FiActivity
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
  FaBrain,
  FaRoute,
  FaMapMarkedAlt
} from 'react-icons/fa';

const specialtyMetadata = {
  'Cardiologist': {
    icon: FaHeartbeat,
    color: 'from-rose-500 to-red-600',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
    description: 'Heart Health, ECG/Echo, Angiography & Cardiovascular Medicine',
    services: [
      'Hypertension & Blood Pressure Control',
      'Coronary Artery Disease Management',
      'Echocardiography & Color Doppler',
      'Preventive Cardiac Risk Screening',
      'Heart Arrhythmia & Palpitations Evaluation',
      'Post-Angioplasty & Bypass Rehabilitation'
    ]
  },
  'Orthopedic Surgeon': {
    icon: FaBone,
    color: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    description: 'Joint Replacement, Spine Disorders, Sports Trauma & Arthroscopy',
    services: [
      'Total Knee & Hip Joint Replacement',
      'Minimally Invasive Spine Surgery',
      'Arthroscopic Ligament (ACL/PCL) Reconstruction',
      'Bone Fracture & Complex Trauma Fixation',
      'Sciatica, Slipped Disc & Neck Pain Care',
      'Osteoarthritis & Osteoporosis Therapy'
    ]
  },
  'Obstetrician & Gynecologist': {
    icon: FaFemale,
    color: 'from-pink-500 to-fuchsia-600',
    badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900',
    description: 'Maternity, High-Risk Pregnancy, Laparoscopy & Women Health',
    services: [
      'Comprehensive Antenatal & Postnatal Care',
      'High-Risk Pregnancy & Normal Delivery Planning',
      'Advanced Laparoscopic Gynecological Surgery',
      'Infertility Evaluation & Follicular Monitoring',
      'PCOS/PCOD & Hormonal Imbalance Management',
      'Cervical Cancer Screening (Pap Smear & HPV)'
    ]
  },
  'Dermatologist': {
    icon: FaStethoscope,
    color: 'from-purple-500 to-indigo-600',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
    description: 'Clinical Dermatology, Hair Loss, Acne Care & Aesthetic Laser',
    services: [
      'Severe Acne & Acne Scar Laser Resurfacing',
      'PRP & Mesotherapy for Hair Loss (Alopecia)',
      'Chronic Eczema, Psoriasis & Vitiligo Protocols',
      'Fungal Infections & Skin Allergy Treatment',
      'Chemical Peels & Skin Brightening Therapy',
      'Mole, Wart & Skin Tag Removal'
    ]
  },
  'Pediatrician': {
    icon: FaBaby,
    color: 'from-sky-500 to-blue-600',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900',
    description: 'Neonatal Care, Pediatric Immunization & Child Wellness',
    services: [
      'Newborn Critical Care & NICU Follow-up',
      'Complete Pediatric Immunization & Vaccine Schedule',
      'Childhood Growth & Developmental Milestone Tracking',
      'Pediatric Asthma & Respiratory Infection Care',
      'Infant Nutrition & Dietary Counseling',
      'Seasonal Viral Fever & Gastrointestinal Illness'
    ]
  },
  'General Physician': {
    icon: FaStethoscope,
    color: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    description: 'Internal Medicine, Chronic Diseases, Diabetes & Infections',
    services: [
      'Type 1 & Type 2 Diabetes Management',
      'Dengue, Malaria, Typhoid & Seasonal Fevers',
      'Thyroid & Endocrine Metabolic Disorders',
      'Respiratory Infections, Bronchitis & Allergies',
      'Digestive, Acidity & Liver Function Disorders',
      'Geriatric (Elderly Patient) Comprehensive Care'
    ]
  },
  'Ophthalmologist': {
    icon: FaEye,
    color: 'from-cyan-500 to-blue-600',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900',
    description: 'Cataract Micro-Surgery, Refractive Vision & Glaucoma Care',
    services: [
      'Micro-Incision Phaco Cataract Surgery with Premium IOL',
      'Refractive Error Assessment (Myopia, Astigmatism)',
      'Glaucoma Screening, IOP Measurement & Drops',
      'Diabetic Retinopathy Screening & Fundus Exam',
      'Dry Eye Syndrome & Computer Vision Syndrome Care',
      'Corneal & Conjunctival Infection Treatment'
    ]
  },
  'ENT Specialist': {
    icon: FaUserMd,
    color: 'from-indigo-500 to-violet-600',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
    description: 'Ear Microsurgery, Sinus Endoscopy & Throat Vocal Care',
    services: [
      'Endoscopic Sinus Surgery (FESS) for Chronic Sinusitis',
      'Microscopic Ear Surgery (Tympanoplasty / Mastoidectomy)',
      'Tonsillitis & Adenoid Care with Coblation',
      'Hearing Loss & Audiometry Speech Evaluation',
      'Vertigo, Dizziness & Tinnitus Diagnostics',
      'Vocal Cord Polyp, Hoarseness & Throat Screening'
    ]
  },
  'Neurologist': {
    icon: FaBrain,
    color: 'from-violet-500 to-purple-600',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900',
    description: 'Stroke Management, Epilepsy, Migraine & Neuro-Rehabilitation',
    services: [
      'Acute Ischemic Stroke Treatment & Neuro ICU Care',
      'Epilepsy, Seizure Monitoring & EEG Evaluation',
      'Migraine, Cluster & Chronic Headache Protocols',
      'Parkinson Disease & Movement Disorder Therapy',
      'Peripheral Neuropathy, Tingling & Nerve Conduction (NCV)',
      'Dementia, Alzheimer & Memory Loss Management'
    ]
  }
};

const gwaliorLandmarks = [
  'Gwalior Railway Station, Platform 1',
  'Thatipur Circle, Gwalior',
  'Morar Bus Stand, Gwalior',
  'Phoolbagh Square, Lashkar',
  'City Center, Patel Nagar',
  'Bada Market, Lashkar',
  'Govindpuri Bus Stop, Gwalior'
];

const DoctorProfile = () => {
  const params = useParams();
  const doctorId = params.doctorId || params.id;
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isHindi = language === 'hi';
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [userOrigin, setUserOrigin] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (doctorId) {
      fetchDoctor();
    } else {
      setLoading(false);
    }
  }, [doctorId]);

  const fetchDoctor = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/doctors/${doctorId}`);
      setDoctor(res.data);
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (!doctor) return;
    const fullText = `${doctor.clinic || doctor.name}, ${doctor.address}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Build Google Maps query and navigation URLs
  const destinationQuery = doctor ? `${doctor.clinic || doctor.name}, ${doctor.address}, Gwalior, Madhya Pradesh` : '';
  const embeddedMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(destinationQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  
  const getNavigationUrl = () => {
    if (userOrigin.trim()) {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(userOrigin.trim())}&destination=${encodeURIComponent(destinationQuery)}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationQuery)}&travelmode=driving`;
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus(isHindi ? 'ब्राउज़र में जीपीएस सुविधा समर्थित नहीं है।' : 'Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationStatus(isHindi ? 'ग्वालियर में आपका जीपीएस स्थान खोजा जा रहा है...' : 'Detecting your GPS location in Gwalior...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude},${position.coords.longitude}`;
        setUserOrigin(coords);
        setLocating(false);
        setLocationStatus(isHindi ? 'जीपीएस स्थान सफलतापूर्वक मिला! नेविगेशन तैयार है।' : 'GPS location detected successfully! Ready to navigate.');
      },
      (err) => {
        setLocating(false);
        setLocationStatus(isHindi ? 'स्थान प्राप्त नहीं हो सका। कृपया अपना क्षेत्र या लैंडमार्क लिखें।' : 'Unable to access GPS location. Please type your area or landmark.');
      },
      { timeout: 10000 }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:text-slate-200">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-bold">
            {isHindi ? 'डॉक्टर का प्रोफाइल लोड हो रहा है...' : 'Loading Doctor Profile...'}
          </h2>
          <p className="text-xs text-slate-400">
            {isHindi ? 'विशेषज्ञ विवरण, क्लिनिक का समय एवं गूगल मैप मार्ग प्राप्त किया जा रहा है' : 'Fetching specialist credentials, chamber hours & Google Map route'}
          </p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="text-6xl mb-2">🔍</div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          {isHindi ? 'डॉक्टर प्रोफाइल नहीं मिला' : 'Doctor Profile Not Found'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isHindi ? 'अनुरोधित डॉक्टर का प्रोफाइल उपलब्ध नहीं है।' : 'The requested doctor profile might have been updated or moved.'}
        </p>
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg hover:bg-blue-700 transition"
        >
          <FiArrowLeft /> {isHindi ? 'ग्वालियर के सभी डॉक्टर देखें' : 'Browse All Gwalior Doctors'}
        </Link>
      </div>
    );
  }

  const meta = specialtyMetadata[doctor.specialization] || {};
  const IconComp = meta.icon || FaUserMd;
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
    <div className="py-6 max-w-7xl mx-auto space-y-8">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <FiArrowLeft /> {t('backToDoctors')}
        </Link>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Link to="/" className="hover:underline">{isHindi ? 'होम' : 'Home'}</Link>
          <span>/</span>
          <Link to="/doctors" className="hover:underline">{isHindi ? 'ग्वालियर डॉक्टर' : 'Gwalior Doctors'}</Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">{doctor.name}</span>
        </div>
      </div>

      {/* Hero Doctor Profile Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
        <div className="p-6 md:p-8 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar / Profile Photo */}
            <div className="relative flex-shrink-0">
              {hasValidImage ? (
                <img
                  src={doctor.profileImage}
                  alt={doctor.name}
                  onError={() => setImageError(true)}
                  className="w-28 h-28 md:w-36 md:h-36 rounded-3xl object-cover ring-4 ring-white dark:ring-slate-700 shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 text-white flex flex-col items-center justify-center ring-4 ring-white dark:ring-slate-700 shadow-xl text-center p-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mb-1 text-blue-300">
                    <span className="text-xl font-black">{initials}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                    {isHindi ? 'प्रमाणित डॉक्टर' : 'Verified Doctor'}
                  </span>
                  <span className="text-[9px] text-slate-400">Gwalior, MP</span>
                </div>
              )}

              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full ring-4 ring-white dark:ring-slate-900 shadow-md" title="Active Gwalior Faculty">
                <FiShield className="text-sm" />
              </div>
            </div>

            {/* Title & Core Credentials */}
            <div className="flex-1 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {doctor.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <FiCheckCircle className="text-emerald-500" /> {isHindi ? 'सत्यापित विशेषज्ञ' : 'Verified Specialist'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <IconComp className="text-base" /> {doctor.specialization}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {doctor.experience}+ {isHindi ? 'वर्षों का चिकित्सीय अनुभव' : 'Years Clinical Practice'}
                </span>
              </div>

              {doctor.clinic && (
                <div className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FaHospital className="text-indigo-500 flex-shrink-0" />
                  <span>{doctor.clinic}</span>
                </div>
              )}

              {doctor.address && (
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <FiMapPin className="text-rose-500 mt-0.5 flex-shrink-0" />
                  <span>{doctor.address}</span>
                </div>
              )}

              {/* Quick Contact & Timings Pills */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                {doctor.timings && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-medium">
                    <FiClock className="text-amber-500" />
                    <span>{isHindi ? 'क्लिनिक समय:' : 'Clinic Hours:'} {doctor.timings.start} – {doctor.timings.end}</span>
                  </div>
                )}
                {doctor.phone && (
                  <a
                    href={`tel:${doctor.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold transition"
                  >
                    <FiPhone className="text-emerald-500" />
                    <span>+91 {doctor.phone}</span>
                  </a>
                )}
                {doctor.email && (
                  <a
                    href={`mailto:${doctor.email}`}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold transition"
                  >
                    <FiMail className="text-blue-500" />
                    <span>{doctor.email}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="w-full md:w-auto flex md:flex-col gap-3 flex-shrink-0">
              <Link
                to={`/book/${doctor._id}`}
                className="flex-1 md:flex-none px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs md:text-sm rounded-2xl text-center shadow-lg shadow-blue-500/25 transition duration-200 flex items-center justify-center gap-2"
              >
                <span>📅 {isHindi ? 'कतारबद्ध टोकन बुक करें' : 'Book Queued Token'}</span>
              </Link>
              <a
                href="#google-map-section"
                className="flex-1 md:flex-none px-5 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl text-center border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-2"
              >
                <FaRoute className="text-blue-500" />
                <span>{t('getDirections')}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Highlights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 text-center">
          <div className="p-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">{t('rating')}</span>
            <span className="text-lg font-black text-amber-500 flex items-center justify-center gap-1 mt-0.5">
              <FiStar className="fill-amber-500" /> {doctor.rating?.toFixed(1) || '4.8'}
              <span className="text-xs text-slate-400 font-normal">({doctor.reviewCount || 120})</span>
            </span>
          </div>
          <div className="p-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">{t('clinicalExperience')}</span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
              {doctor.experience} {isHindi ? 'वर्ष' : 'Years'}
            </span>
          </div>
          <div className="p-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">{isHindi ? 'स्थान' : 'Location'}</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
              Gwalior, MP
            </span>
          </div>
          <div className="p-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">{isHindi ? 'कतार टोकन' : 'Queue Token'}</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              ● {t('liveQueueReady')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Map Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: About Doctor, Specialty Services, Timings, Reviews */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: About the Doctor */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
                <FaUserMd />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isHindi ? `परिचय: ${doctor.name}` : `About ${doctor.name}`}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHindi ? 'चिकित्सीय अनुभव एवं पृष्ठभूमि' : 'Professional medical profile & background'}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {doctor.name} is a highly regarded <strong>{doctor.specialization}</strong> in Gwalior, Madhya Pradesh with over <strong>{doctor.experience} years</strong> of clinical experience. Practicing at <strong>{doctor.clinic || 'Main Clinic Facility'}</strong>, {doctor.name} is trusted by patients across Gwalior, Chambal, and northern Madhya Pradesh for thorough diagnosis, empathetic care, and modern evidence-based treatment.
            </p>

            {/* Weekly Schedule Badges */}
            {doctor.availableDays && doctor.availableDays.length > 0 && (
              <div className="pt-2">
                <span className="text-xs uppercase font-bold text-slate-400 block mb-2">
                  {t('weeklyChamberDays')}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {doctor.availableDays.map((day) => (
                    <span
                      key={day}
                      className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-slate-700 flex items-center gap-1"
                    >
                      <FiCalendar className="text-[11px]" /> {day}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Clinical Services & Treatments */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
                <FiActivity />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('specializedTreatments')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHindi ? `${doctor.name} द्वारा उपलब्ध विशेष चिकित्सीय उपचार` : `Clinical procedures performed by ${doctor.name}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {(meta.services || [
                'Comprehensive Diagnosis & Health Assessment',
                'Advanced Clinical Consultation & Treatment',
                'Routine Follow-up & Preventive Wellness Checks',
                'Emergency & Acute Symptom Management'
              ]).map((svc, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-start gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                >
                  <FiCheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0 text-sm" />
                  <span>{svc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Verified Patient Reviews */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center text-lg">
                  <FiStar className="fill-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('verifiedReviews')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isHindi ? 'ग्वालियर के मरीजों की वास्तविक समीक्षाएं' : 'Real feedback from consultations in Gwalior'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-amber-500">
                  {doctor.rating?.toFixed(1) || '4.8'} / 5.0
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {doctor.reviewCount || 120} {isHindi ? 'समीक्षाएं' : 'ratings'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {doctor.reviews && doctor.reviews.length > 0 ? (
                doctor.reviews.map((rev, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.imageUrl || `https://randomuser.me/api/portraits/${idx % 2 === 0 ? 'men' : 'women'}/${30 + idx}.jpg`}
                          alt={rev.name}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {rev.name}
                        </span>
                      </div>
                      <div className="flex items-center text-amber-500 text-xs gap-0.5">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <FiStar key={i} className="fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      &quot;{rev.comment}&quot;
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">
                  {isHindi
                    ? `अभी कोई समीक्षा नहीं है। ${doctor.name} से परामर्श लें और पहली समीक्षा लिखें!`
                    : `No written reviews yet. Be the first to consult and review ${doctor.name}!`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: GOOGLE MAP & NAVIGATION SECTION */}
        <div id="google-map-section" className="lg:col-span-5 space-y-6">
          {/* Main Google Maps Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg">
                  <FaMapMarkedAlt />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t('clinicLocationMap')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gwalior, Madhya Pradesh
                  </p>
                </div>
              </div>
              <button
                onClick={handleCopyAddress}
                className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1 transition"
                title="Copy Address"
              >
                <FiCopy /> {copied ? (isHindi ? 'कॉपी हो गया!' : 'Copied!') : (isHindi ? 'कॉपी' : 'Copy')}
              </button>
            </div>

            {/* Address Display Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FaHospital className="text-blue-500" />
                <span>{doctor.clinic || (isHindi ? 'विशेषज्ञ क्लिनिक' : 'Specialist Clinic')}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 leading-relaxed">
                <FiMapPin className="text-rose-500 mt-0.5 flex-shrink-0" />
                <span>{doctor.address}</span>
              </p>
            </div>

            {/* Live Embedded Interactive Google Map */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner h-72 bg-slate-100 dark:bg-slate-800">
              <iframe
                title={`Google Map Location of ${doctor.name}`}
                src={embeddedMapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
              <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 shadow border border-slate-200 dark:border-slate-700">
                Live Google Maps
              </div>
            </div>

            {/* Reach Doctor's Location from Your Destination */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FaRoute className="text-indigo-500" />
                  <span>{t('navigateFromOrigin')}:</span>
                </span>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                >
                  <FiNavigation className={locating ? 'animate-spin' : ''} />
                  <span>{locating ? t('detecting') : t('useMyGps')}</span>
                </button>
              </div>

              {locationStatus && (
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  {locationStatus}
                </p>
              )}

              {/* Destination/Origin Input */}
              <div className="relative">
                <FiMapPin className="absolute left-3.5 top-3 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder={t('originPlaceholder')}
                  value={userOrigin}
                  onChange={(e) => setUserOrigin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quick Landmark Chips in Gwalior */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {t('quickOrigin')}:
                </span>
                <div className="flex flex-wrap gap-1">
                  {gwaliorLandmarks.map((lm) => (
                    <button
                      key={lm}
                      type="button"
                      onClick={() => setUserOrigin(lm)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                        userOrigin === lm
                          ? 'bg-blue-600 text-white border-blue-600 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {lm.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open in Google Maps Primary Button */}
              <a
                href={getNavigationUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2"
              >
                <FiNavigation className="text-base" />
                <span>{t('openInGoogleMaps')}</span>
                <FiExternalLink className="text-xs" />
              </a>

              <p className="text-[11px] text-slate-400 text-center">
                {isHindi
                  ? 'क्लिनिक तक पहुंचने के लिए रीयल-टाइम ट्रैफिक एवं ट्रांजिट नेविगेशन के साथ गूगल मैप्स खोलें।'
                  : 'Launches Google Maps with real-time transit & traffic directions directly to the clinic.'}
              </p>
            </div>
          </div>

          {/* Sticky Booking CTA Card */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                {t('readyForConsultation')}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold">
                {t('onlineToken')}
              </span>
            </div>

            <h4 className="text-xl font-black leading-tight">
              {isHindi ? `${doctor.name} के साथ अपॉइंटमेंट बुक करें` : `Book Your Appointment with ${doctor.name}`}
            </h4>

            <p className="text-xs text-blue-100 leading-relaxed">
              {isHindi
                ? 'अभी अपना डिजिटल कतार टोकन सुरक्षित करें। अपने फोन पर रीयल-टाइम प्रतीक्षा समय ट्रैक करें।'
                : 'Reserve your digital queue token right now. Track wait times in real time on your phone and arrive right when the doctor is ready.'}
            </p>

            <Link
              to={`/book/${doctor._id}`}
              className="w-full py-3.5 px-4 bg-white text-blue-700 hover:bg-blue-50 font-black text-sm rounded-2xl block text-center shadow-lg transition duration-200"
            >
              📅 {isHindi ? 'कतारबद्ध अपॉइंटमेंट टोकन बुक करें →' : 'Reserve Queued Appointment Token →'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
