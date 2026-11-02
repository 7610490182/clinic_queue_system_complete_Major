import { createContext, useContext, useState, useEffect } from 'react';

export const translations = {
  en: {
    home: 'Home',
    findDoctors: 'Find Doctors',
    findSpecialist: 'Find Doctors',
    findSpecialistInGwalior: 'Find Your Specialist in Gwalior',
    doctorSearchSubtitle: 'Explore real verified doctors practicing across Lashkar, Morar, Thatipur, City Center, and Govindpuri.',
    searchPlaceholder: 'Search symptom, doctor, clinic, or locality (e.g. Lashkar, Heart, Dr. Modi, Skin)...',
    allSpecializations: 'All Specializations',
    specializationDisciplines: 'Specialization Disciplines',
    resetFilters: 'Reset All Filters',
    allSpecialists: 'All Specialists',
    verifiedPractitioner: 'Verified Practitioner',
    clinicalExperience: 'Clinical Experience',
    chamberHours: 'Chamber Hours',
    weeklyChamberDays: 'Weekly Chamber Days',
    viewDetailsMap: 'View Details & Google Map',
    bookQueuedAppointment: 'Book Queued Appointment',
    backToDoctors: 'Back to All Gwalior Doctors',
    getDirections: 'Get Directions',
    liveQueueReady: 'Live Queue Ready',
    specializedTreatments: 'Specialized Treatments & Procedures',
    verifiedReviews: 'Verified Patient Reviews',
    clinicLocationMap: 'Clinic Location & Map',
    navigateFromOrigin: 'Navigate From Your Destination',
    useMyGps: 'Use My GPS',
    detecting: 'Detecting...',
    originPlaceholder: 'Enter your origin (e.g. Railway Station, Thatipur, Morar)...',
    quickOrigin: 'Quick Origin in Gwalior',
    openInGoogleMaps: 'Open Turn-by-Turn Navigation in Google Maps',
    trackToken: 'Track Token',
    checkIn: 'Check-In',
    receptionCheckIn: 'Reception Check-In',
    records: 'Health Records',
    healthRecords: 'Health Records (EMR)',
    myAppointments: 'My Appointments',
    digitalProfile: 'Digital Profile',
    profile: 'Digital Profile',
    analytics: 'Analytics',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    doctorDashboard: 'Doctor Dashboard',
    adminPanel: 'Admin Panel',
    adminDashboard: 'Admin Dashboard',
    liveQueue: 'Live Queue',
    dashboard: 'Dashboard',
    language: 'Language',
    highContrast: 'High Contrast',
    fontSize: 'Text Size',
    bookAppointment: 'Book Appointment',
    bookNow: 'Book Appointment',
    estimatedWaitTime: 'Estimated Wait Time',
    confidenceRange: 'Confidence Range',
    patientsAhead: 'Patients Ahead',
    currentlyConsulting: 'Currently in Chamber',
    emergencyPriority: 'Emergency Priority',
    tokenNumber: 'Token Number',
    checkedIn: 'Checked In',
    navigateClinic: 'Navigate to Clinic',
    digitalPrescription: 'Digital Prescription',
    telemedicine: 'Virtual Consultation',
    abhaNumber: 'ABHA Health ID',
    dpdpConsent: 'DPDP Consent Active',
    voiceAnnounce: 'Audio Announcement',
    allSpecialties: 'All Specialties',
    searchDoctor: 'Search by doctor name or specialty...',
    experienceYears: 'years exp',
    rating: 'Rating',
    reviews: 'Reviews',
    availableToday: 'Available Today',
    consultationFee: 'Consultation Fee',
    morningSlots: 'Morning Slots',
    eveningSlots: 'Evening Slots',
    confirmBooking: 'Confirm Booking',
    patientName: 'Patient Name',
    phone: 'Phone Number',
    status: 'Status',
    waiting: 'Waiting',
    inRoom: 'In Room',
    completed: 'Completed',
    cancelled: 'Cancelled',
    smartClinicSystems: 'Smart Clinic Systems 2027',
    dragTip: 'Drag to move position anywhere',
    resetPos: 'Reset position to corner',
    fixByChoice: 'Fix Position by Choice',
    posBottomRight: 'Bottom Right',
    posBottomLeft: 'Bottom Left',
    posTopRight: 'Top Right',
    posTopLeft: 'Top Left',
    trackLive: 'Track Live',
    selectDoctorPrompt: '1. Select Specialist in Gwalior',
    tokenNumberPrompt: '2. Token Number',
    nowServing: 'Now Serving',
    yourToken: 'Your Token',
    inConsultation: 'In Consultation',
    callChamber: 'Call Doctor Chamber',
    qrCheckInModal: 'Contactless QR Kiosk Check-In',
    readyForConsultation: 'Ready for Consultation?',
    onlineToken: 'Online Token',
    textSizeXSmall: 'Extra Small (--a / -20%)',
    textSizeSmall: 'Small (-A / -10%)',
    textSizeNormal: 'Normal (A / 100%)',
    textSizeLarge: 'Large (A+ / +15%)',
    textSizeXLarge: 'Extra Large (A++ / +30%)',
    adjustTextSize: 'Adjust Text Size'
  },
  hi: {
    home: 'होम',
    findDoctors: 'डॉक्टर खोजें',
    findSpecialist: 'डॉक्टर खोजें',
    findSpecialistInGwalior: 'ग्वालियर में अपने विशेषज्ञ डॉक्टर खोजें',
    doctorSearchSubtitle: 'लश्कर, मुरार, थाटीपुर, सिटी सेंटर और गोविंदपुरी के प्रमाणित डॉक्टरों से परामर्श लें।',
    searchPlaceholder: 'लक्षण, डॉक्टर, क्लिनिक या इलाका खोजें (जैसे लश्कर, दिल, डॉ. मोदी, त्वचा)...',
    allSpecializations: 'सभी विशेषज्ञताएं',
    specializationDisciplines: 'विशेषज्ञ श्रेणियां',
    resetFilters: 'सभी फ़िल्टर हटाएं',
    allSpecialists: 'सभी विशेषज्ञ',
    verifiedPractitioner: 'प्रमाणित चिकित्सक',
    clinicalExperience: 'चिकित्सीय अनुभव',
    chamberHours: 'क्लिनिक का समय',
    weeklyChamberDays: 'सप्ताह के परामर्श दिन',
    viewDetailsMap: 'विवरण व गूगल मैप देखें',
    bookQueuedAppointment: 'कतारबद्ध अपॉइंटमेंट बुक करें',
    backToDoctors: 'ग्वालियर के सभी डॉक्टरों पर वापस जाएं',
    getDirections: 'रास्ता देखें (नेविगेशन)',
    liveQueueReady: 'लाइव कतार सक्रिय',
    specializedTreatments: 'विशेष उपचार एवं प्रक्रियाएं',
    verifiedReviews: 'सत्यापित मरीजों की समीक्षाएं',
    clinicLocationMap: 'क्लिनिक का स्थान एवं गूगल मैप',
    navigateFromOrigin: 'अपने स्थान से रास्ता देखें',
    useMyGps: 'मेरा जीपीएस स्थान उपयोग करें',
    detecting: 'स्थान खोज रहे हैं...',
    originPlaceholder: 'अपना प्रारंभिक स्थान दर्ज करें (जैसे रेलवे स्टेशन, थाटीपुर, मुरार)...',
    quickOrigin: 'ग्वालियर के प्रमुख स्थान',
    openInGoogleMaps: 'गूगल मैप्स में टर्न-बाय-टर्न नेविगेशन खोलें',
    trackToken: 'टोकन ट्रैक करें',
    checkIn: 'चेक-इन (कियोस्क)',
    receptionCheckIn: 'रिसेप्शन चेक-इन',
    records: 'स्वास्थ्य रिकॉर्ड (EMR)',
    healthRecords: 'स्वास्थ्य रिकॉर्ड (EMR)',
    myAppointments: 'मेरी नियुक्तियां',
    digitalProfile: 'डिजिटल प्रोफाइल',
    profile: 'डिजिटल प्रोफाइल',
    analytics: 'विश्लेषिकी',
    login: 'लॉग इन',
    logout: 'लॉग आउट',
    register: 'पंजीकरण',
    doctorDashboard: 'डॉक्टर डैशबोर्ड',
    adminPanel: 'एडमिन पैनल',
    adminDashboard: 'एडमिन डैशबोर्ड',
    liveQueue: 'लाइव कतार',
    dashboard: 'डैशबोर्ड',
    language: 'भाषा',
    highContrast: 'उच्च कंट्रास्ट',
    fontSize: 'अक्षर आकार',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    bookNow: 'अपॉइंटमेंट बुक करें',
    estimatedWaitTime: 'अनुमानित प्रतीक्षा समय',
    confidenceRange: 'समय सीमा (रेंज)',
    patientsAhead: 'आपसे पहले मरीज',
    currentlyConsulting: 'केबिन में वर्तमान मरीज',
    emergencyPriority: 'आपातकालीन प्राथमिकता',
    tokenNumber: 'टोकन नंबर',
    checkedIn: 'उपस्थित (चेक-इन)',
    navigateClinic: 'क्लिनिक का रास्ता',
    digitalPrescription: 'डिजिटल पर्चा (Rx)',
    telemedicine: 'वीडियो परामर्श',
    abhaNumber: 'आभा (ABHA) स्वास्थ्य आईडी',
    dpdpConsent: 'सहमति सक्रिय (DPDP)',
    voiceAnnounce: 'आवाज में सुनें',
    allSpecialties: 'सभी विशेषज्ञताएं',
    searchDoctor: 'डॉक्टर के नाम या विशेषज्ञता से खोजें...',
    experienceYears: 'वर्ष अनुभव',
    rating: 'रेटिंग',
    reviews: 'समीक्षाएं',
    availableToday: 'आज उपलब्ध',
    consultationFee: 'परामर्श शुल्क',
    morningSlots: 'सुबह के स्लॉट',
    eveningSlots: 'शाम के स्लॉट',
    confirmBooking: 'बुकिंग सुनिश्चित करें',
    patientName: 'मरीज का नाम',
    phone: 'मोबाइल नंबर',
    status: 'स्थिति',
    waiting: 'प्रतीक्षारत',
    inRoom: 'केबिन में',
    completed: 'सम्पन्न',
    cancelled: 'रद्द',
    smartClinicSystems: 'स्मार्ट क्लिनिक सिस्टम 2027',
    dragTip: 'स्थान बदलने के लिए खींचें',
    resetPos: 'स्थान रीसेट करें',
    fixByChoice: 'अपनी पसंद का स्थान चुनें',
    posBottomRight: 'निचला दायां',
    posBottomLeft: 'निचला बायां',
    posTopRight: 'ऊपरी दायां',
    posTopLeft: 'ऊपरी बायां',
    trackLive: 'लाइव स्थिति ट्रैक करें',
    selectDoctorPrompt: '1. ग्वालियर के विशेषज्ञ का चयन करें',
    tokenNumberPrompt: '2. टोकन नंबर दर्ज करें',
    nowServing: 'वर्तमान टोकन',
    yourToken: 'आपका टोकन',
    inConsultation: 'परामर्श जारी',
    callChamber: 'क्लिनिक पर कॉल करें',
    qrCheckInModal: 'संपर्क रहित कियोस्क चेक-इन',
    readyForConsultation: 'परामर्श के लिए तैयार?',
    onlineToken: 'ऑनलाइन टोकन',
    textSizeXSmall: 'अति सूक्ष्म (--a / -20%)',
    textSizeSmall: 'छोटा (-A / -10%)',
    textSizeNormal: 'सामान्य (A / 100%)',
    textSizeLarge: 'बड़ा (A+ / +15%)',
    textSizeXLarge: 'अति बड़ा (A++ / +30%)',
    adjustTextSize: 'अक्षर का आकार बदलें'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('clinic_lang') || 'en');
  const [textSize, setTextSize] = useState(() => localStorage.getItem('clinic_text_size') || 'normal');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('clinic_high_contrast') === 'true');

  const triggerGoogleTranslate = (targetLang) => {
    try {
      const cookieVal = targetLang === 'hi' ? '/en/hi' : '/en/en';
      document.cookie = `googtrans=${cookieVal}; path=/;`;
      if (window.location.hostname) {
        document.cookie = `googtrans=${cookieVal}; path=/; domain=.${window.location.hostname};`;
      }

      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const selectElem = document.querySelector('.goog-te-combo');
        if (selectElem) {
          if (selectElem.value !== targetLang) {
            selectElem.value = targetLang;
            selectElem.dispatchEvent(new Event('change'));
          }
          clearInterval(interval);
        }
        if (attempts > 8) clearInterval(interval);
      }, 250);
    } catch (err) {
      console.warn('Google Translate sync error:', err);
    }
  };

  useEffect(() => {
    localStorage.setItem('clinic_lang', language);
    document.documentElement.lang = language;
    triggerGoogleTranslate(language);
  }, [language]);

  const TEXT_SIZES = ['xsmall', 'small', 'normal', 'large', 'xlarge'];

  useEffect(() => {
    localStorage.setItem('clinic_text_size', textSize);
    const root = document.documentElement;
    const body = document.body;

    const classes = [
      'text-size-xsmall',
      'text-size-small',
      'text-size-normal',
      'text-size-large',
      'text-size-xlarge'
    ];
    root.classList.remove(...classes);
    if (body) {
      body.classList.remove(...classes);
    }

    if (textSize === 'xsmall') {
      root.classList.add('text-size-xsmall');
      root.style.fontSize = '12.8px'; // -20% font scaling (--a / --A)
      if (body) body.classList.add('text-size-xsmall');
    } else if (textSize === 'small') {
      root.classList.add('text-size-small');
      root.style.fontSize = '14.4px'; // -10% font scaling (-A / -a)
      if (body) body.classList.add('text-size-small');
    } else if (textSize === 'large') {
      root.classList.add('text-size-large');
      root.style.fontSize = '18.5px'; // +15.6% font scaling (A+ / +A)
      if (body) body.classList.add('text-size-large');
    } else if (textSize === 'xlarge') {
      root.classList.add('text-size-xlarge');
      root.style.fontSize = '21px'; // +31.25% font scaling (A++ / ++A)
      if (body) body.classList.add('text-size-xlarge');
    } else {
      root.classList.add('text-size-normal');
      root.style.fontSize = '16px'; // 100% baseline (A)
      if (body) body.classList.add('text-size-normal');
    }
  }, [textSize]);

  const decreaseTextSize = () => {
    setTextSize((curr) => {
      const idx = TEXT_SIZES.indexOf(curr);
      if (idx > 0) return TEXT_SIZES[idx - 1];
      return curr;
    });
  };

  const increaseTextSize = () => {
    setTextSize((curr) => {
      const idx = TEXT_SIZES.indexOf(curr);
      if (idx !== -1 && idx < TEXT_SIZES.length - 1) return TEXT_SIZES[idx + 1];
      return curr;
    });
  };

  const resetTextSize = () => {
    setTextSize('normal');
  };

  const cycleTextSize = () => {
    setTextSize((curr) => {
      const idx = TEXT_SIZES.indexOf(curr);
      const nextIdx = (idx + 1) % TEXT_SIZES.length;
      return TEXT_SIZES[nextIdx];
    });
  };

  useEffect(() => {
    localStorage.setItem('clinic_high_contrast', highContrast);
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const toggleLanguage = () => {
    const next = language === 'hi' ? 'en' : 'hi';
    setLanguage(next);
  };

  const t = (key) => {
    if (!key) return '';
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  /**
   * Browser Speech Synthesis for Token Announcements in English or Hindi
   */
  const speakAnnouncement = (text, targetLang = language) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        lang: language,
        setLanguage,
        setLang: setLanguage,
        toggleLanguage,
        t,
        speakAnnouncement,
        textSize,
        setTextSize,
        fontSize: textSize,
        setFontSize: setTextSize,
        decreaseTextSize,
        increaseTextSize,
        resetTextSize,
        cycleTextSize,
        TEXT_SIZES,
        highContrast,
        setHighContrast: () => setHighContrast(prev => !prev)
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
