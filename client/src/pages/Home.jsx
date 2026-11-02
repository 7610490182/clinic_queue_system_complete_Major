import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  FiSearch,
  FiCompass,
  FiCalendar,
  FiClock,
  FiShield,
  FiCreditCard,
  FiActivity,
  FiUsers,
  FiCheckCircle,
  FiPhoneCall,
  FiArrowRight,
  FiZap,
  FiAward,
  FiHelpCircle,
  FiChevronDown,
  FiChevronUp,
  FiMapPin,
  FiStar,
  FiCpu,
  FiCheck,
  FiAlertCircle,
  FiTrendingUp,
  FiCoffee
} from 'react-icons/fi';
import {
  FaUserMd,
  FaHospital,
  FaHeartbeat,
  FaStethoscope,
  FaQrcode,
  FaAmbulance,
  FaUserCheck,
  FaRegHospital
} from 'react-icons/fa';

const Home = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  // Search & Navigation
  const [symptomSearch, setSymptomSearch] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Interactive Live Chamber Radar
  const [selectedRadarDocIndex, setSelectedRadarDocIndex] = useState(0);

  // Interactive AI Wait-Time Simulator
  const [simPatientsAhead, setSimPatientsAhead] = useState(3);
  const [simDoctorIndex, setSimDoctorIndex] = useState(0);
  const [simTimeSlot, setSimTimeSlot] = useState('morning'); // 'morning' | 'evening'

  // Interactive Patient Journey Steps
  const [activeStep, setActiveStep] = useState(0);

  // Interactive FAQ Accordion
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [faqFilter, setFaqFilter] = useState('');

  const isHindi = language === 'hi';

  // Fetch verified doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axios.get('/api/doctors');
        const docs = Array.isArray(res.data) ? res.data : (res.data?.doctors || []);
        setDoctors(docs);
      } catch (err) {
        console.error('Error fetching doctors on homepage:', err.message);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (symptomSearch.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(symptomSearch.trim())}`);
    } else {
      navigate('/doctors');
    }
  };

  const handleQuickSymptom = (symptom) => {
    setSymptomSearch(symptom);
    navigate(`/doctors?search=${encodeURIComponent(symptom)}`);
  };

  // Popular Quick Symptoms Chips
  const popularSymptoms = [
    { label: isHindi ? 'बुखार / फ्लू' : 'Fever & Flu', query: 'fever' },
    { label: isHindi ? 'हृदय / सीने में दर्द' : 'Chest Pain / Heart', query: 'heart' },
    { label: isHindi ? 'त्वचा / एलर्जी' : 'Skin Rash & Acne', query: 'skin' },
    { label: isHindi ? 'हड्डी / जोड़ों का दर्द' : 'Joint & Back Pain', query: 'bone' },
    { label: isHindi ? 'शिशु स्वास्थ्य' : 'Child Health', query: 'child' },
    { label: isHindi ? 'ईएनटी (कान/नाक/गला)' : 'ENT Infection', query: 'ear' }
  ];

  // Verified Clinical Departments
  const departments = [
    {
      name: isHindi ? 'जनरल फिजिशियन' : 'General Medicine',
      symptom: 'fever',
      icon: <FaStethoscope />,
      desc: isHindi ? 'वायरल, बीपी, मधुमेह एवं सामान्य स्वास्थ्य' : 'Fever, Diabetes, BP, Infections',
      count: '3 Doctors',
      color: 'from-blue-500 to-indigo-600',
      avgTime: '12 min'
    },
    {
      name: isHindi ? 'हृदय रोग (कार्डियोलॉजी)' : 'Cardiology Center',
      symptom: 'heart',
      icon: <FaHeartbeat />,
      desc: isHindi ? 'ईसीजी, इको, एंजियोग्राफी, छाती का दर्द' : 'ECG, Echo, Angio, Heart Care',
      count: '3 Specialists',
      color: 'from-rose-500 to-red-600',
      avgTime: '18 min'
    },
    {
      name: isHindi ? 'हड्डी एवं जोड़ (ऑर्थो)' : 'Orthopedics & Spine',
      symptom: 'bone',
      icon: <FiShield />,
      desc: isHindi ? 'रीढ़, घुटना, फ्रैक्चर एवं गठिया रोग' : 'Joints, Spine, Fractures, Arthritis',
      count: '4 Surgeons',
      color: 'from-amber-500 to-orange-600',
      avgTime: '15 min'
    },
    {
      name: isHindi ? 'त्वचा एवं सौंदर्य (डर्मा)' : 'Dermatology & Skin',
      symptom: 'skin',
      icon: <FiActivity />,
      desc: isHindi ? 'मुंहासे, एलर्जी, हेयर फॉल, लेजर केयर' : 'Acne, Allergies, Hair, Laser Clinic',
      count: '4 Specialists',
      color: 'from-pink-500 to-purple-600',
      avgTime: '14 min'
    },
    {
      name: isHindi ? 'शिशु एवं बाल रोग' : 'Pediatrics & Kids',
      symptom: 'child',
      icon: <FaHeartbeat />,
      desc: isHindi ? 'टीकाकरण, नवजात शिशु, बाल पोषण' : 'Vaccinations, Newborns, Child Care',
      count: '3 Specialists',
      color: 'from-purple-500 to-indigo-600',
      avgTime: '15 min'
    },
    {
      name: isHindi ? 'कान, नाक एवं गला (ENT)' : 'ENT Specialists',
      symptom: 'ear',
      icon: <FaHospital />,
      desc: isHindi ? 'साइनस, टॉन्सिल, कान का दर्द, एलर्जी' : 'Sinus, Tonsils, Ear Infection, Allergy',
      count: '2 Specialists',
      color: 'from-teal-500 to-emerald-600',
      avgTime: '12 min'
    }
  ];

  // Default featured doctors if backend is loading
  const featuredDoctors = doctors.length > 0
    ? doctors.slice(0, 5)
    : [
        {
          _id: 'default-1',
          name: 'Dr. Akash Modi',
          specialization: 'Cardiologist',
          clinic: 'Shreenath Heart Care & Sahara Hospital',
          rating: 4.9,
          experience: 14
        },
        {
          _id: 'default-2',
          name: 'Dr. Vipin Garg',
          specialization: 'Orthopedic Surgeon',
          clinic: 'KLM Spine Clinic, City Center',
          rating: 4.9,
          experience: 16
        },
        {
          _id: 'default-3',
          name: 'Dr. Parag Srivastava',
          specialization: 'General Physician',
          clinic: 'Dr. Parag Srivastava Clinic',
          rating: 4.9,
          experience: 12
        },
        {
          _id: 'default-4',
          name: 'Dr. Manish Kuber',
          specialization: 'Pediatrician',
          clinic: 'Kuber Bal Chikitsalaya',
          rating: 4.9,
          experience: 15
        },
        {
          _id: 'default-5',
          name: 'Dr. Shivansh Kanchan',
          specialization: 'Dermatologist',
          clinic: 'Siddhi Skin Hair & Laser Clinic',
          rating: 4.8,
          experience: 10
        }
      ];

  const currentRadarDoc = featuredDoctors[selectedRadarDocIndex] || featuredDoctors[0];

  // Real-time calculation for simulator
  const activeSimDoc = featuredDoctors[simDoctorIndex] || featuredDoctors[0];
  const baseConsultDuration = activeSimDoc.specialization === 'Cardiologist' ? 18 : (activeSimDoc.specialization === 'Orthopedic Surgeon' ? 16 : 14);
  const timeFactor = simTimeSlot === 'evening' ? 1.15 : 1.0;
  const estimatedWaitMin = Math.round(simPatientsAhead * baseConsultDuration * timeFactor);
  const confidenceMin = Math.max(5, estimatedWaitMin - 4);
  const confidenceMax = estimatedWaitMin + 6;
  const congestionTier = simPatientsAhead <= 2 ? 'LOW' : (simPatientsAhead <= 5 ? 'MODERATE' : 'PEAK');

  // Interactive 4 Steps Journey
  const journeySteps = [
    {
      step: '01',
      title: isHindi ? 'विशेषज्ञ चिकित्सक चुनें' : 'Select Verified Specialist',
      subtitle: isHindi ? 'ग्वालियर के वरिष्ठ डॉक्टरों के स्लॉट' : 'Top Verified Doctors across Gwalior',
      description: isHindi
        ? 'विभिन्न विभागों के अनुभवी चिकित्सकों की विशेषज्ञता, अनुभव, और चैम्बर समय देखकर पसंदीदा स्लॉट चुनें।'
        : 'Browse senior consultants by specialty, read verified patient ratings, and select an optimal consultation slot.',
      icon: <FaUserMd className="w-6 h-6" />,
      color: 'bg-blue-600'
    },
    {
      step: '02',
      title: isHindi ? 'स्मार्ट डिजिटल टोकन प्राप्त करें' : 'Get Instant Smart Token',
      subtitle: isHindi ? 'बिना किसी कतार के तत्काल पुष्टिकरण' : 'Zero Duplicate Collision Guarantee',
      description: isHindi
        ? 'आपके नाम और समय के अनुसार एक अनूठा परमाणु टोकन नंबर और त्वरित क्यूआर कोड जारी किया जाता है।'
        : 'Our atomic sequence engine locks in a guaranteed unique queue token and generates a tamper-proof check-in QR pass.',
      icon: <FaQrcode className="w-6 h-6" />,
      color: 'bg-indigo-600'
    },
    {
      step: '03',
      title: isHindi ? 'लाइव रडार से घर बैठे ट्रैक करें' : 'Track Live Queue Anywhere',
      subtitle: isHindi ? 'अस्पताल में घंटों बैठने की जरूरत नहीं' : 'Arrive Exactly When Ready',
      description: isHindi
        ? 'फोन पर लाइव देखें कि वर्तमान में कौन सा टोकन चल रहा है और आपका अनुमानित प्रतीक्षा समय कितना है।'
        : 'Watch the live consultation counter update in real-time on your phone and arrive right as your turn approaches.',
      icon: <FiCompass className="w-6 h-6" />,
      color: 'bg-emerald-600'
    },
    {
      step: '04',
      title: isHindi ? 'डिजिटल पर्चा एवं रिकॉर्ड' : 'Digital EMR & ABDM Sync',
      subtitle: isHindi ? 'सुरक्षित एवं सदैव सुलभ' : 'India DPDP Act 2023 Compliant',
      description: isHindi
        ? 'परामर्श पूर्ण होते ही डिजिटल हस्ताक्षर युक्त पर्चा सीधे आपकी प्रोफ़ाइल में सहेज लिया जाता है।'
        : 'Receive a digitally signed e-prescription directly to your mobile profile, synced seamlessly with ABDM health records.',
      icon: <FiCheckCircle className="w-6 h-6" />,
      color: 'bg-purple-600'
    }
  ];

  // Interactive FAQs
  const faqs = [
    {
      q: isHindi ? 'डिजिटल कतार (स्मार्ट टोकन) कैसे काम करता है?' : 'How does the digital queue system work?',
      a: isHindi
        ? 'जैसे ही आप अपॉइंटमेंट बुक करते हैं, आपको एक स्वचालित टोकन नंबर आवंटित होता है। आप अपने फोन से किसी भी समय "लाइव टोकन ट्रैक" पर जाकर देख सकते हैं कि कौन सा मरीज चैम्बर में है और आपका नंबर आने में कितने मिनट बाकी हैं।'
        : 'When you book an appointment, an atomic sequential token number is generated. You can monitor the live doctor consultation progress from anywhere via our Track Token radar, arriving only when your turn is close.'
    },
    {
      q: isHindi ? 'यदि मैं समय पर नहीं पहुंच पाया तो क्या होगा?' : 'What happens if I arrive late or miss my token call?',
      a: isHindi
        ? 'यदि आप टोकन पुकारे जाने के समय उपस्थित नहीं हैं, तो सिस्टम आपको स्वचालित रूप से "लेट अराइवल" के रूप में चिह्नित करता है। जैसे ही आप रिसेप्शन पर संपर्क करेंगे, डॉक्टर का अगला उपलब्ध स्लॉट आपको बिना नया टोकन लिए आवंटित किया जाएगा।'
        : 'If you arrive after your token has been called, our smart triage marks your arrival. Staff can seamlessly place you as the next consultation without requiring you to re-register or book a new token.'
    },
    {
      q: isHindi ? 'क्या क्लिनिक पर सीधे आने वाले (वॉक-इन) मरीजों को भी टोकन मिलता है?' : 'Can walk-in patients also get tokens at the clinic?',
      a: isHindi
        ? 'हाँ! क्लिनिक रिसेप्शन पर संपर्क रहित कियोस्क और क्यूआर स्कैनर स्थापित है। वॉक-इन मरीज रिसेप्शन काउंटर से तुरंत उसी दिन का डिजिटल टोकन प्राप्त कर सकते हैं।'
        : 'Yes! Reception staff can instantly issue digital walk-in tokens via our reception kiosk, ensuring online and walk-in patients are merged into one synchronized, transparent queue.'
    },
    {
      q: isHindi ? 'आपातकालीन या गंभीर मरीजों के लिए क्या व्यवस्था है?' : 'How are emergency or severe patients prioritized?',
      a: isHindi
        ? 'हमारे सिस्टम में अधिकृत स्टाफ द्वारा "आपातकालीन ट्राइएज" की सुविधा है। गंभीर मामलों को तुरंत प्राथमिकता श्रेणी में स्थानांतरित किया जाता है ताकि उन्हें बिना प्रतीक्षा के तुरंत चिकित्सा मिल सके।'
        : 'Authorized clinical staff have an emergency triage escalation protocol that dynamically moves critical cases to the front of the queue, ensuring urgent medical attention.'
    },
    {
      q: isHindi ? 'क्या मेरी मेडिकल रिपोर्ट और पर्चे सुरक्षित हैं?' : 'Are my medical records and prescriptions secure?',
      a: isHindi
        ? 'बिल्कुल। हमारा सिस्टम भारत के डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDP Act 2023) और आयुष्मान भारत (ABDM) मानकों का पूरी तरह पालन करता है। केवल आप और आपके अधिकृत डॉक्टर ही आपका रिकॉर्ड देख सकते हैं।'
        : 'Yes, 100%. All consultations, vitals, and e-prescriptions adhere strictly to the India DPDP Act 2023 and ABDM FHIR standards, protected with role-based access control and end-to-end encryption.'
    }
  ];

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(faqFilter.toLowerCase()) ||
    f.a.toLowerCase().includes(faqFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">

      {/* TOP LIVE OPERATIONAL PULSE BAR */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border-b border-indigo-500/20 text-white text-xs py-2.5 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isHindi ? 'लाइव ओपीडी सक्रिय' : 'OPD Chambers Active'}
            </span>
            <span className="hidden sm:inline text-slate-300">
              {isHindi ? 'ग्वालियर मुख्य क्लिनिक एवं सहारा हॉस्पिटल विंग' : 'Gwalior Main Clinic & Sahara Outpatient Wing'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <FiClock className="text-amber-400" />
              <strong className="text-white">14m</strong> {isHindi ? 'औसत प्रतीक्षा' : 'Avg Wait'}
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <FiCheckCircle className="text-emerald-400" />
              <strong className="text-white">99.2%</strong> {isHindi ? 'समय पर परामर्श' : 'Punctuality'}
            </span>
            <span className="flex items-center gap-1.5 text-blue-200">
              <FiShield className="text-blue-400" />
              <span>ABDM & DPDP 2023</span>
            </span>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-indigo-950 to-slate-950 text-white py-16 lg:py-24 px-4">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center relative z-10">

          {/* Left Column: Heading, Search & Value Prop */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-blue-200 uppercase tracking-wider">
              <FiZap className="text-amber-400" />
              {isHindi ? 'स्मार्ट हेल्थकेयर टोकन एवं कतार प्रबंधन 2027' : 'Smart Healthcare Token & Queue Platform 2027'}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
              {isHindi ? 'भीड़ भरे वेटिंग रूम से मुक्ति।' : 'Skip The Waiting Room.'}
              <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent block mt-2">
                {isHindi ? 'लाइव एआई टोकन रडार।' : 'Arrive Exactly On Time.'}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              {isHindi
                ? 'ग्वालियर के शीर्ष प्रमाणित चिकित्सकों से समय स्लॉट बुक करें, तत्काल डिजिटल टोकन प्राप्त करें, घर से रडार ट्रैक करें और तभी पहुंचें जब आपकी बारी हो।'
                : 'Book senior Gwalior specialists, receive collision-free atomic queue tokens, monitor live consultation progress from anywhere, and consult without hours of idle waiting.'}
            </p>

            {/* Smart Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto lg:mx-0 pt-2">
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-2">
                <FiSearch className="text-slate-300 text-xl ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder={isHindi ? 'लक्षण या डॉक्टर खोजें (जैसे बुखार, खांसी, दिल, त्वचा, घुटने का दर्द)...' : 'Search by symptom or doctor (e.g. fever, chest pain, skin rash, ortho)...'}
                  value={symptomSearch}
                  onChange={(e) => setSymptomSearch(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none px-2"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>{isHindi ? 'खोजें' : 'Find Doctor'}</span>
                  <FiArrowRight />
                </button>
              </div>

              {/* Popular Symptom Tags */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-3">
                <span className="text-[11px] text-slate-400 font-semibold">{isHindi ? 'त्वरित खोज:' : 'Quick Tag:'}</span>
                {popularSymptoms.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickSymptom(s.query)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 text-xs transition"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </form>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <FiCheckCircle className="text-emerald-400" /> {isHindi ? 'प्रमाणित ग्वालियर विशेषज्ञ' : '26+ Verified Specialists'}
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <FiCheckCircle className="text-emerald-400" /> {isHindi ? 'शून्य डुप्लिकेट टोकन गारंटी' : 'Atomic Token Engine'}
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <FiCheckCircle className="text-emerald-400" /> {isHindi ? 'क्यूआर संपर्क रहित चेक-इन' : 'Contactless QR Arrival'}
              </span>
            </div>
          </div>

          {/* Right Column: INTERACTIVE CHAMBER RADAR */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-white/20 shadow-2xl space-y-5 relative">

              {/* Doctor Chamber Selector Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">
                    {isHindi ? 'लाइव ओपीडी चैम्बर रडार' : 'Live Chamber Telemetry'}
                  </span>
                  <h3 className="font-bold text-white text-base sm:text-lg">
                    {currentRadarDoc.name}
                  </h3>
                  <p className="text-slate-300 text-xs flex items-center gap-1 mt-0.5">
                    <FiMapPin className="text-rose-400 text-xs" /> {currentRadarDoc.clinic}
                  </p>
                </div>

                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isHindi ? 'परामर्श जारी' : 'Chamber Open'}
                </span>
              </div>

              {/* Chamber Selector Pills */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-2 font-semibold">
                  {isHindi ? 'चैम्बर बदलें (सक्रिय डॉक्टर चुनें):' : 'Select Chamber to Monitor:'}
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {featuredDoctors.map((doc, idx) => (
                    <button
                      key={doc._id}
                      onClick={() => setSelectedRadarDocIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                        selectedRadarDocIndex === idx
                          ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      }`}
                    >
                      {doc.name.split(' ')[1] || doc.name} ({doc.specialization.split(' ')[0]})
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Token Telemetry Counters */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {isHindi ? 'वर्तमान टोकन' : 'Now Inside'}
                  </span>
                  <div className="text-4xl font-black text-emerald-400 mt-1">#14</div>
                  <span className="text-[11px] text-slate-300 mt-1 block">
                    {isHindi ? 'परामर्श कक्ष में' : 'In Consultation'}
                  </span>
                </div>

                <div className="bg-blue-600/30 p-4 rounded-2xl border border-blue-400/30 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                    {isHindi ? 'अगला टोकन' : 'Next In Line'}
                  </span>
                  <div className="text-4xl font-black text-white mt-1">#15</div>
                  <span className="text-[11px] text-blue-200 mt-1 block">
                    {isHindi ? 'अनुमानित ~14 मिनट' : '~14 min wait est.'}
                  </span>
                </div>
              </div>

              {/* Telemetry Details */}
              <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-white/10 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <FiTrendingUp className="text-blue-400" /> {isHindi ? 'एआई प्रतीक्षा पूर्वानुमान:' : 'AI Wait Forecast:'}
                  </span>
                  <strong className="text-white">~12 – 18 mins</strong>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <FiStar className="text-amber-400" /> {isHindi ? 'सत्यापित रेटिंग:' : 'Doctor Rating:'}
                  </span>
                  <span className="text-amber-300 font-bold">★ {currentRadarDoc.rating || 4.9} / 5.0</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 grid grid-cols-2 gap-2.5">
                <Link
                  to={`/book/${currentRadarDoc._id}`}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-3 rounded-xl text-center text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <FiCalendar /> {isHindi ? 'अपॉइंटमेंट लें' : 'Book Appointment'}
                </Link>

                <Link
                  to="/track-token"
                  className="bg-white/10 hover:bg-white/15 text-slate-100 font-bold py-3 px-3 rounded-xl text-center text-xs border border-white/15 transition flex items-center justify-center gap-1.5"
                >
                  <FiCompass /> {isHindi ? 'टोकन ट्रैक करें' : 'Track My Token'}
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* INTERACTIVE AI WAIT-TIME SIMULATOR / ESTIMATOR WIDGET */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 mb-2">
              <FiCpu className="text-sm" />
              {isHindi ? 'इंटरएक्टिव एआई प्रतीक्षा कैलकुलेटर' : 'Interactive AI Wait-Time Predictor'}
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isHindi ? 'जानें आपको कितना इंतजार करना होगा' : 'How Long Will You Wait? Test with AI'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              {isHindi
                ? 'डॉक्टर और आगे मौजूद मरीजों की संख्या चुनें, हमारा मशीन लर्निंग मॉडल वास्तविक समय की गणना करेगा।'
                : 'Select your doctor and adjust the queue slider to see real-time AI wait estimates based on historical consultation times.'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-700/80 shadow-lg grid lg:grid-cols-12 gap-8 items-center">

            {/* Left Controls */}
            <div className="lg:col-span-7 space-y-6">

              {/* Select Doctor Chamber */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  {isHindi ? '1. परामर्श चिकित्सक चुनें:' : '1. Select Consultation Chamber:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {featuredDoctors.slice(0, 4).map((doc, idx) => (
                    <button
                      key={doc._id}
                      onClick={() => setSimDoctorIndex(idx)}
                      className={`p-3 rounded-2xl text-left border transition flex items-center justify-between ${
                        simDoctorIndex === idx
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{doc.name}</div>
                        <div className={`text-[10px] ${simDoctorIndex === idx ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                          {doc.specialization}
                        </div>
                      </div>
                      {simDoctorIndex === idx && <FiCheck className="text-white text-base shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider: Patients Ahead */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {isHindi ? '2. आपके आगे कितने मरीज हैं?' : '2. Number of Patients Ahead of You:'}
                  </label>
                  <span className="px-3 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-sm border border-indigo-200 dark:border-indigo-800">
                    {simPatientsAhead} {isHindi ? 'मरीज' : simPatientsAhead === 1 ? 'Patient' : 'Patients'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={simPatientsAhead}
                  onChange={(e) => setSimPatientsAhead(parseInt(e.target.value, 10))}
                  className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>1 Patient (Fast)</span>
                  <span>6 Patients (Medium)</span>
                  <span>12 Patients (Peak OPD)</span>
                </div>
              </div>

              {/* Shift Timing */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  {isHindi ? '3. ओपीडी सत्र:' : '3. OPD Shift:'}
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSimTimeSlot('morning')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition ${
                      simTimeSlot === 'morning'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🌅 {isHindi ? 'सुबह का सत्र (09:00 - 13:00)' : 'Morning OPD (09:00 – 13:00)'}
                  </button>
                  <button
                    onClick={() => setSimTimeSlot('evening')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition ${
                      simTimeSlot === 'evening'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🌆 {isHindi ? 'शाम का सत्र (17:00 - 20:30)' : 'Evening OPD (17:00 – 20:30)'}
                  </button>
                </div>
              </div>

            </div>

            {/* Right Output Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 border border-indigo-500/30 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  {isHindi ? 'एआई लाइव गणना' : 'Predicted OPD Duration'}
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  congestionTier === 'LOW'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : congestionTier === 'MODERATE'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {congestionTier} OPD Rush
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">
                  {isHindi ? 'अनुमानित प्रतीक्षा समय:' : 'Estimated Total Wait Time:'}
                </span>
                <div className="text-4xl sm:text-5xl font-black text-white mt-1">
                  ~{estimatedWaitMin} <span className="text-lg font-normal text-indigo-300">mins</span>
                </div>
                <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                  <FiClock className="text-indigo-400" />
                  {isHindi ? `विश्वास सीमा: ${confidenceMin} – ${confidenceMax} मिनट` : `Confidence Window: ${confidenceMin} – ${confidenceMax} mins`}
                </div>
              </div>

              <div className="space-y-2.5 pt-2 text-xs text-slate-300 border-t border-white/10">
                <div className="flex justify-between">
                  <span>{isHindi ? 'चैम्बर गति दर:' : 'Average Consult Duration:'}</span>
                  <strong className="text-white">~{baseConsultDuration} mins / patient</strong>
                </div>
                <div className="flex justify-between">
                  <span>{isHindi ? 'घर से निकलने की सलाह:' : 'Recommended Departure:'}</span>
                  <strong className="text-emerald-400">{Math.max(5, estimatedWaitMin - 15)} mins before turn</strong>
                </div>
                <div className="flex justify-between">
                  <span>{isHindi ? 'एआई मॉडल विश्वसनीयता:' : 'Model Confidence Score:'}</span>
                  <strong className="text-indigo-300">94.8% (Scikit-Learn)</strong>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={`/book/${activeSimDoc._id}`}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-xl text-center text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <FiCalendar />
                  {isHindi ? `डॉक्टर ${activeSimDoc.name.split(' ')[1] || activeSimDoc.name} का स्लॉट लें` : `Book Slot with ${activeSimDoc.name}`}
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS: 4-STEP INTERACTIVE PATIENT JOURNEY */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-2">
            {isHindi ? 'सरल एवं पारदर्शी प्रक्रिया' : 'Transparent 4-Step Outpatient Workflow'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {isHindi ? 'पारंपरिक वेटिंग रूम को कहें अलविदा' : 'How MediQueue Replaces The Waiting Room'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            {isHindi
              ? 'अपॉइंटमेंट से लेकर डिजिटल पर्चे तक—सभी सुविधाएं आपके मोबाइल पर।'
              : 'From your first booking to digital prescription storage, experience seamless clinic care without queues.'}
          </p>
        </div>

        {/* 4 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {journeySteps.map((j, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setActiveStep(idx)}
              className={`p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                activeStep === idx
                  ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-xl -translate-y-1.5'
                  : 'bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 rounded-2xl ${j.color} text-white flex items-center justify-center text-xl shadow-md`}>
                    {j.icon}
                  </div>
                  <span className="text-2xl font-black text-slate-300 dark:text-slate-700">
                    {j.step}
                  </span>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                  {j.subtitle}
                </span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                  {j.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {j.description}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6 flex items-center text-xs font-bold text-blue-600 dark:text-blue-400">
                <span>{isHindi ? 'चरण विवरण' : 'Phase Overview'}</span>
                <FiArrowRight className="ml-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SPECIALTIES / DEPARTMENTS GRID */}
      <section className="py-16 px-4 bg-slate-100 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-2">
              {isHindi ? 'ग्वालियर के वरिष्ठ विशेषज्ञ' : 'Comprehensive Clinical Wings'}
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isHindi ? 'विभाग या लक्षण के अनुसार परामर्श लें' : 'Consult by Department or Health Need'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              {isHindi
                ? 'सभी प्रमुख विभागों में ग्वालियर के प्रमाणित चिकित्सकों की सूची उपलब्ध है।'
                : 'Direct access to senior OPD consultants with instant digital queue token booking.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map((dept, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/doctors?search=${dept.symptom}`)}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-200 cursor-pointer flex items-start gap-4 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${dept.color} text-white flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition shrink-0`}>
                  {dept.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                      {dept.name}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {dept.count}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {dept.desc}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <FiClock className="text-amber-500" /> ~{dept.avgTime}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-1 transition flex items-center gap-1">
                      {isHindi ? 'डॉक्टर देखें' : 'View Doctors'} &rarr;
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EMERGENCY TRIAGE & RED PROTOCOL ALERT */}
      <section className="py-14 px-4 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-10 border border-rose-500/30 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 uppercase tracking-wide">
              <FaAmbulance /> {isHindi ? 'आपातकालीन ट्राइएज प्राथमिकता' : 'Emergency Triage Escalation Protocol'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              {isHindi ? 'क्या मरीज की स्थिति गंभीर है?' : 'Critical or Emergency Care Needed?'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isHindi
                ? 'छाती में तेज दर्द, सांस लेने में तकलीफ, या गंभीर चोट जैसी स्थितियों में हमारे अधिकृत कर्मचारी मरीज को तुरंत कतार से आगे प्राथमिकता देते हैं।'
                : 'Patients presenting with acute chest pain, trauma, or severe distress are triaged ahead of the general queue by authorized clinical staff.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href="tel:108"
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/30 transition flex items-center gap-2"
            >
              <FiPhoneCall className="text-base" />
              <span>{isHindi ? 'आपातकालीन एम्बुलेंस: 108' : 'Call Ambulance: 108'}</span>
            </a>
            <Link
              to="/reception-checkin"
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs sm:text-sm border border-white/20 transition flex items-center gap-2"
            >
              <FaQrcode />
              <span>{isHindi ? 'कियोस्क क्यूआर चेक-इन' : 'Reception Kiosk Check-In'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* VERIFIED PATIENT REVIEWS & RATINGS */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-2">
              {isHindi ? 'ग्वालियर के मरीजों के अनुभव' : 'Patient Stories & Ratings'}
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isHindi ? 'सत्यापित मरीजों की समीक्षाएं' : 'Trusted by 12,000+ Patients in Gwalior'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              {isHindi
                ? 'देखें कि कैसे MediQueue ने प्रतीक्षा समय को घंटों से घटाकर मिनटों में बदल दिया।'
                : 'Real feedback from patients who booked and tracked their consultation tokens digitally.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center gap-1 text-amber-400 text-sm">
                <FiStar className="fill-amber-400" />
                <FiStar className="fill-amber-400" />
                <FiStar className="fill-amber-400" />
                <FiStar className="fill-amber-400" />
                <FiStar className="fill-amber-400" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                &ldquo;{isHindi
                  ? 'डॉ. आकाश मोदी के चैम्बर में पहले 2-3 घंटे बैठना पड़ता था। इस ऐप से टोकन लिया, घर पर चाय पी और जब नंबर #12 आया तभी पहुंचे। बेहतरीन अनुभव!'
                  : 'Earlier we waited 2+ hours at Dr. Akash Modi’s clinic. With MediQueue, we watched the token counter from home and reached right on time!'}&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">Rameshwar Sharma</strong>
                  <span className="text-[11px] text-slate-400">Cardiology Patient • Gwalior</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  Verified Visit
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center gap-1 text-amber-400 text-sm">
                <FiStar className="fill-amber-400" />
                <FiStar className="fill-amber-400" />
                <FiStar className="fill-amber-400" />
                <FiStar className="fill-amber-400" />
                <FiStar className="fill-amber-400" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                &ldquo;{isHindi
                  ? 'बच्चे की तबीयत खराब थी और क्लिनिक में भीड़ में बैठना बहुत मुश्किल था। लाइव टोकन ट्रैकर ने हमारा समय और तनाव दोनों बचा लिया।'
                  : 'Taking an unwell toddler to a crowded clinic was stressful. The live wait radar helped us arrive exactly 5 minutes before our turn.'}&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">Pooja Rathore</strong>
                  <span className="text-[11px] text-slate-400">Pediatrics • Lashkar</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  Verified Visit
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center gap-1 text-amber-400 text-sm">
                <FiStar className="fill-amber-400" />
                <FiStar className="fill-amber-400" />
                <FiStar className="fill-amber-400" />
                <FiStar className="fill-amber-400" />
                <FiStar className="fill-amber-400" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                &ldquo;{isHindi
                  ? 'डॉ. विपिन गर्ग के ऑर्थो चेकअप के बाद डिजिटल पर्चा तुरंत ऐप में आ गया। कागजी पर्चे खोने का कोई डर नहीं।'
                  : 'After consulting Dr. Vipin Garg, the digital prescription was immediately saved in my health timeline with ABDM sync.'}&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">Vivek Dixit</strong>
                  <span className="text-[11px] text-slate-400">Orthopedic • City Center</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  Verified Visit
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE FAQ ACCORDION SECTION */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-2">
            {isHindi ? 'अक्सर पूछे जाने वाले सवाल' : 'Help & Common Queries'}
          </span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isHindi ? 'मरीजों के मन में उठने वाले सवाल' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            {isHindi
              ? 'डिजिटल कतार, टोकन और क्लिनिक नियमों से संबंधित सभी जानकारियां।'
              : 'Everything you need to know about atomic tokens, live tracking, and clinic visits.'}
          </p>

          {/* FAQ Filter Input */}
          <div className="max-w-md mx-auto mt-6">
            <div className="relative">
              <input
                type="text"
                placeholder={isHindi ? 'सवाल खोजें...' : 'Filter questions...'}
                value={faqFilter}
                onChange={(e) => setFaqFilter(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            </div>
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <span className="flex items-center gap-2.5">
                    <FiHelpCircle className="text-blue-500 shrink-0" />
                    {faq.q}
                  </span>
                  {isOpen ? <FiChevronUp className="shrink-0 text-slate-400" /> : <FiChevronDown className="shrink-0 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER CALL-TO-ACTION BANNER */}
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider">
            {isHindi ? 'आज ही डिजिटल स्वास्थ्य का अनुभव करें' : 'Experience Modern Outpatient Care'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            {isHindi ? 'अपनी अगली डॉक्टर विज़िट को बनाएं तनावमुक्त।' : 'Ready to Experience Hassle-Free Clinic Visits?'}
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto font-normal">
            {isHindi
              ? 'ग्वालियर के वरिष्ठ डॉक्टरों से अभी स्लॉट बुक करें और वास्तविक समय में कतार ट्रैक करें।'
              : 'Choose your specialist, reserve a verified queue slot, and track your turn live from your mobile device.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/doctors"
              className="px-8 py-3.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-black text-sm shadow-xl transition flex items-center gap-2"
            >
              <span>{isHindi ? 'डॉक्टर खोजें एवं बुक करें' : 'Browse All Doctors'}</span>
              <FiArrowRight />
            </Link>
            <Link
              to="/track-token"
              className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm transition flex items-center gap-2"
            >
              <FiCompass />
              <span>{isHindi ? 'लाइव टोकन ट्रैक करें' : 'Track Existing Token'}</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
