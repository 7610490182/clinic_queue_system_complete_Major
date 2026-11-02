import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  FiX,
  FiSend,
  FiUser,
  FiHelpCircle,
  FiActivity,
  FiClock,
  FiCreditCard,
  FiPhoneCall,
  FiMic,
  FiMicOff,
  FiInfo,
  FiShield,
  FiCheckCircle,
  FiCalendar,
  FiMove,
  FiRotateCcw,
  FiSliders,
  FiCheck
} from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { MdDragIndicator } from 'react-icons/md';

const quickPromptsEn = [
  { label: '🩺 Find Gwalior Doctors', query: 'Which doctors and specialties are available in Gwalior?' },
  { label: '🎫 Live Wait & Token', query: 'How does AI waiting-time prediction work?' },
  { label: '📋 Appointment Prep', query: 'How should I prepare for my doctor appointment?' },
  { label: '💳 Fees & Payment', query: 'What is the consultation fee and how do I pay?' },
  { label: '🏥 Timings & Location', query: 'What are the clinic timings and Gwalior address?' },
  { label: '🚨 Emergency Desk', query: 'What should I do in an acute emergency?' }
];

const quickPromptsHi = [
  { label: '🩺 ग्वालियर के डॉक्टर खोजें', query: 'ग्वालियर में कौन-कौन से डॉक्टर और विशेषज्ञ उपलब्ध हैं?' },
  { label: '🎫 टोकन और प्रतीक्षा समय', query: 'मेरा टोकन और डॉक्टर का अनुमानित समय कैसे देखें?' },
  { label: '📋 अपॉइंटमेंट तैयारी', query: 'डॉक्टर से मिलने से पहले क्या तैयारी करनी चाहिए?' },
  { label: '💳 परामर्श शुल्क', query: 'डॉक्टर की फीस कितनी है और ऑनलाइन भुगतान कैसे करें?' },
  { label: '🏥 समय और पता', query: 'क्लिनिक का समय और ग्वालियर में पता क्या है?' },
  { label: '🚨 आपातकालीन सहायता', query: 'आपातकालीन स्थिति में क्या करें?' }
];

const knowledgeBase = [
  {
    keywords: ['fever', 'cough', 'cold', 'flu', 'viral', 'bukhar', 'khansi', 'general'],
    replyEn: 'For fever, cough, cold, or viral fatigue, consult our **General Physicians** in Gwalior (e.g. Dr. Amit Sharma, Dr. V.K. Jain). You can book a direct slot with AI wait-time estimation.',
    replyHi: 'बुखार, खांसी, जुकाम या वायरल के लिए आप हमारे **जनरल फिजिशियन** (जैसे डॉ. अमित शर्मा, डॉ. वी.के. जैन) से परामर्श ले सकते हैं।',
    action: { label: 'Find General Physicians', path: '/doctors?search=general' }
  },
  {
    keywords: ['heart', 'chest', 'bp', 'cardio', 'dil', 'pressure', 'hypertension'],
    replyEn: '⚠️ For severe chest pain, shortness of breath, or sweating, immediately call **108** or visit the 24/7 Emergency Wing. For routine cardiac reviews, consult our Senior Interventional Cardiologists.',
    replyHi: '⚠️ सीने में तेज दर्द या सांस फूलने पर तुरंत **108** पर कॉल करें। नियमित जांच के लिए हमारे वरिष्ठ कार्डियोलॉजिस्ट से परामर्श लें।',
    action: { label: 'Cardiology Specialists', path: '/doctors?search=cardio' }
  },
  {
    keywords: ['skin', 'derma', 'rash', 'acne', 'itching', 'twacha', 'khujli', 'hair'],
    replyEn: 'For skin rashes, allergies, acne, or dermatological care, book a consultation with our verified Dermatologists in Lashkar & City Center, Gwalior.',
    replyHi: 'त्वचा की एलर्जी, मुँहासे, या त्वचा रोग के लिए हमारे प्रमाणित डर्मेटोलॉजिस्ट से अपॉइंटमेंट लें।',
    action: { label: 'Dermatology Specialists', path: '/doctors?search=derma' }
  },
  {
    keywords: ['bone', 'ortho', 'joint', 'knee', 'back', 'haddi', 'dard', 'fracture'],
    replyEn: 'For joint pain, knee arthritis, back discomfort, or bone injuries, our Gwalior Orthopedic Surgeons are available Mon–Sat.',
    replyHi: 'हड्डियों, जोड़ों के दर्द, घुटनों की समस्या के लिए हमारे ऑर्थोपेडिक सर्जनों से परामर्श लें।',
    action: { label: 'Orthopedic Doctors', path: '/doctors?search=ortho' }
  },
  {
    keywords: ['child', 'pediatric', 'baby', 'bachha', 'kid', 'shishu', 'vaccine'],
    replyEn: 'For infants, children wellness, and vaccination, consult our dedicated Pediatric specialists.',
    replyHi: 'बच्चों की बीमारी और नियमित टीकाकरण के लिए हमारे शिशु रोग विशेषज्ञों से संपर्क करें।',
    action: { label: 'Pediatric Care', path: '/doctors?search=pediatric' }
  },
  {
    keywords: ['prep', 'prepare', 'fasting', 'test', 'taiyari', 'instructions', 'bring'],
    replyEn: '📋 **Appointment Preparation Checklist (Clinical Guidelines)**:\n1. **Fasting**: 8–10 hours overnight fasting required only if fasting blood sugar or lipid panels are scheduled.\n2. **Documents**: Bring previous medical prescriptions, lab reports, and your 14-digit ABHA card.\n3. **Medications**: Keep taking your routine BP or thyroid medicines unless specifically instructed otherwise.\n4. **Arrival**: Arrive 10–15 minutes before your AI-predicted token window to complete contactless QR kiosk check-in.',
    replyHi: '📋 **अपॉइंटमेंट तैयारी दिशानिर्देश**:\n1. **उपवास**: यदि खाली पेट शुगर या लिपिड टेस्ट है, तो 8–10 घंटे खाली पेट रहें।\n2. **दस्तावेज़**: पुरानी पर्चियां, जांच रिपोर्ट और 14 अंकों का ABHA कार्ड साथ लाएं।\n3. **दवाइयां**: अपनी नियमित बीपी या थायराइड दवा चालू रखें।\n4. **आगमन**: अपने अनुमानित समय से 10-15 मिनट पहले पहुंचकर QR चेक-इन करें।',
    action: { label: 'View Health Records (EMR)', path: '/health-records' }
  },
  {
    keywords: ['wait', 'prediction', 'ai wait', 'predict', 'delay', 'how long', 'samay', 'kitna der'],
    replyEn: '⏱️ **AI Wait-Time Engine (2027)**:\nOur machine learning model analyzes:\n• Number of patients waiting ahead of you\n• Doctor\'s specialty baseline consultation duration (e.g. Cardio: 18 min, General: 10 min)\n• Live delays reported from the doctor\'s console\n• Delivers a confidence interval (e.g., 15–25 mins) and precise call-in clock time.',
    replyHi: '⏱️ **एआई प्रतीक्षा-समय प्रणाली**:\nहमारी प्रणाली विशेषज्ञता, कतार की स्थिति और परामर्श की औसत अवधि का विश्लेषण करके आपको 15-25 मिनट जैसा सटीक समय अंतराल दर्शाती है।',
    action: { label: 'Track My Token Live', path: '/track-token' }
  },
  {
    keywords: ['fee', 'fees', 'cost', 'pay', 'payment', 'razorpay', 'paisa', 'shulk'],
    replyEn: '💳 **Consultation Fees & Payment**:\n• Standard Consultation: **₹500** per visit\n• Payment modes: Razorpay UPI, GPay, Paytm, Cards, Net Banking, or Clinic Counter Cash.\n• Payments can be completed online during booking or right after from **My Appointments**.',
    replyHi: '💳 **परामर्श शुल्क व भुगतान**:\n• मानक परामर्श शुल्क: **₹500**\n• भुगतान के तरीके: UPI, Google Pay, कार्ड्स, नेट बैंकिंग या क्लिनिक काउंटर पर नकद।',
    action: { label: 'Manage Appointments', path: '/my-appointments' }
  },
  {
    keywords: ['timing', 'hours', 'address', 'location', 'gwalior', 'kahan', 'pata'],
    replyEn: '🏥 **Clinic Timings & Gwalior Location**:\n• **Chamber Hours**: Monday to Saturday: 08:30 AM – 08:00 PM (Sunday Closed for routine OPD)\n• **Address**: Medical Enclave, Central Healthcare Blvd, Lashkar / City Center, Gwalior, MP 474009\n• **Emergency Desk**: 24 Hours Open (Emergency Ward-1)\n• **Reception**: +91 (0751) 245-8900.',
    replyHi: '🏥 **क्लिनिक का समय और पता**:\n• **समय**: सोमवार से शनिवार: सुबह 08:30 से रात 08:00 बजे तक\n• **पता**: मेडिकल एन्क्लेव, लश्कर / सिटी सेंटर, ग्वालियर, मध्य प्रदेश 474009\n• **आपातकालीन सेवा**: 24 घंटे उपलब्ध\n• **हेल्पलाइन**: +91 (0751) 245-8900',
    action: { label: 'View All Doctors & Maps', path: '/doctors' }
  },
  {
    keywords: ['emergency', '108', 'ambulance', 'accident', 'serious', 'emergency desk'],
    replyEn: '🚨 **ACUTE EMERGENCY ALERT**:\n• Call Ambulance Hotline: **108**\n• Clinic Urgent Care Direct Desk: **+91 98765 00108**\n• Our 24/7 Trauma & Emergency Triage handles acute priority cases immediately without queue waiting.',
    replyHi: '🚨 **आपातकालीन सहायता**:\n• एम्बुलेंस के लिए तुरंत डायल करें: **108**\n• क्लिनिक इमरजेंसी डेस्क: **+91 98765 00108**\n• आपातकालीन मामलों को बिना कतार के तुरंत देखा जाता है।',
    action: null
  },
  {
    keywords: ['telemedicine', 'video', 'online consultation', 'remote', 'ghar baithe'],
    replyEn: '📹 **Telemedicine & Virtual Appointments**:\nYou can attend peer-to-peer video consultations right from home! Submit your pre-consultation vitals (BP, pulse, symptoms) in the virtual waiting room, and receive a digitally signed prescription upon completion.',
    replyHi: '📹 **टेलीमेडिसिन और वीडियो परामर्श**:\nघर बैठे डॉक्टर से वीडियो कॉल पर परामर्श लें और डिजिटल हस्ताक्षरित पर्ची प्राप्त करें।',
    action: { label: 'Check My Appointments', path: '/my-appointments' }
  },
  {
    keywords: ['abha', 'fhir', 'ayushman', 'records', 'emr', 'dpdp'],
    replyEn: '🇮🇳 **ABDM & FHIR 2027 Standards**:\n• Link your 14-digit Ayushman Bharat ABHA ID\n• Download your interoperable HL7 FHIR R4 clinical JSON bundle\n• Manage consent for medical record sharing under India’s DPDP Act 2023.',
    replyHi: '🇮🇳 **आयुष्मान भारत डिजिटल मिशन (ABDM)**:\n14 अंकों का ABHA आईडी लिंक करें और अपने डिजिटल स्वास्थ्य रिकॉर्ड (FHIR R4) सुरक्षित रखें।',
    action: { label: 'Patient EMR Records', path: '/health-records' }
  }
];

const Chatbot = () => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPosMenu, setShowPosMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Position state with persistent localStorage support
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('chatbot_custom_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    return { x: null, y: null }; // default to bottom-right fixed
  });

  // Drag tracking refs
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, elemX: 0, elemY: 0 });
  const hasMovedRef = useRef(false);
  const containerRef = useRef(null);

  // Initialize welcome message based on language
  useEffect(() => {
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: language === 'hi'
          ? 'नमस्ते! 🙏 मैं हूँ **मेडीबॉट (MediBot 2027)**, आपका स्मार्ट क्लिनिक और कतार सहायक। मैं ग्वालियर के डॉक्टरों, लाइव टोकन स्थिति, अपॉइंटमेंट की तैयारी और क्लिनिक सेवाओं में आपकी सहायता कर सकता हूँ।'
          : 'Hello! 👋 I am **MediBot 2027**, your AI clinic navigator. I can assist you with finding verified Gwalior specialists, live AI wait-time tracking, appointment preparation instructions, or clinic FAQs.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Adjust position within viewport boundaries whenever open state changes
  useEffect(() => {
    if (position.x !== null && position.y !== null) {
      const elemWidth = isOpen ? Math.min(440, window.innerWidth - 16) : 200;
      const elemHeight = isOpen ? Math.min(610, window.innerHeight - 16) : 60;
      const maxX = Math.max(8, window.innerWidth - elemWidth - 8);
      const maxY = Math.max(8, window.innerHeight - elemHeight - 8);

      const clampedX = Math.min(Math.max(8, position.x), maxX);
      const clampedY = Math.min(Math.max(8, position.y), maxY);

      if (clampedX !== position.x || clampedY !== position.y) {
        const nextPos = { x: clampedX, y: clampedY };
        setPosition(nextPos);
        try {
          localStorage.setItem('chatbot_custom_pos', JSON.stringify(nextPos));
        } catch {}
      }
    }
  }, [isOpen]);

  // Voice recognition setup
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please try Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // --- DRAGGABLE HANDLERS ---
  const handleStartDrag = (clientX, clientY, e) => {
    if (e && e.preventDefault) e.preventDefault();
    isDraggingRef.current = true;
    hasMovedRef.current = false;

    let currentX = position.x;
    let currentY = position.y;

    if (currentX === null || currentY === null) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        currentX = rect.left;
        currentY = rect.top;
      } else {
        currentX = window.innerWidth - (isOpen ? 460 : 200);
        currentY = window.innerHeight - (isOpen ? 640 : 80);
      }
    }

    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      elemX: currentX,
      elemY: currentY
    };
  };

  const handleMove = useCallback((clientX, clientY) => {
    if (!isDraggingRef.current) return;

    const deltaX = clientX - dragStartRef.current.mouseX;
    const deltaY = clientY - dragStartRef.current.mouseY;

    if (Math.hypot(deltaX, deltaY) > 4) {
      hasMovedRef.current = true;
    }

    const elemWidth = containerRef.current ? containerRef.current.offsetWidth : (isOpen ? 440 : 180);
    const elemHeight = containerRef.current ? containerRef.current.offsetHeight : (isOpen ? 610 : 60);

    const minX = 8;
    const maxX = Math.max(8, window.innerWidth - elemWidth - 8);
    const minY = 8;
    const maxY = Math.max(8, window.innerHeight - elemHeight - 8);

    const newX = Math.min(Math.max(minX, dragStartRef.current.elemX + deltaX), maxX);
    const newY = Math.min(Math.max(minY, dragStartRef.current.elemY + deltaY), maxY);

    setPosition({ x: newX, y: newY });
  }, [isOpen]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        handleMove(e.clientX, e.clientY);
      }
    };
    const onTouchMove = (e) => {
      if (isDraggingRef.current && e.touches[0]) {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onStopDrag = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        if (hasMovedRef.current) {
          setPosition(curr => {
            if (curr.x !== null && curr.y !== null) {
              try {
                localStorage.setItem('chatbot_custom_pos', JSON.stringify(curr));
              } catch {}
            }
            return curr;
          });
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onStopDrag);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onStopDrag);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onStopDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onStopDrag);
    };
  }, [handleMove]);

  // Position presets allowing user to "fix by choice"
  const setPresetPosition = (corner) => {
    setShowPosMenu(false);
    const elemWidth = isOpen ? 440 : 180;
    const elemHeight = isOpen ? 610 : 60;

    let target = { x: null, y: null };
    if (corner === 'bottom-right') {
      target = { x: window.innerWidth - elemWidth - 24, y: window.innerHeight - elemHeight - 24 };
    } else if (corner === 'bottom-left') {
      target = { x: 24, y: window.innerHeight - elemHeight - 24 };
    } else if (corner === 'top-right') {
      target = { x: window.innerWidth - elemWidth - 24, y: 84 };
    } else if (corner === 'top-left') {
      target = { x: 24, y: 84 };
    } else if (corner === 'reset') {
      setPosition({ x: null, y: null });
      try {
        localStorage.removeItem('chatbot_custom_pos');
      } catch {}
      return;
    }

    setPosition(target);
    try {
      localStorage.setItem('chatbot_custom_pos', JSON.stringify(target));
    } catch {}
  };

  const handleResetPosition = (e) => {
    e.stopPropagation();
    setPosition({ x: null, y: null });
    setShowPosMenu(false);
    try {
      localStorage.removeItem('chatbot_custom_pos');
    } catch {}
  };

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      const matched = knowledgeBase.find(item =>
        item.keywords.some(k => lower.includes(k))
      );

      let replyText = '';
      let action = null;

      if (matched) {
        replyText = language === 'hi' ? (matched.replyHi || matched.replyEn) : matched.replyEn;
        action = matched.action;
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('namaste') || lower.includes('hey')) {
        replyText = language === 'hi'
          ? 'नमस्ते! 🙏 मैं आपकी किस प्रकार मदद कर सकता हूँ? आप डॉक्टर, टोकन या अपॉइंटमेंट के बारे में पूछ सकते हैं।'
          : 'Hello there! 👋 How can I help guide your clinic visit or appointment today?';
      } else if (lower.includes('thank') || lower.includes('shukriya') || lower.includes('dhanyavad')) {
        replyText = language === 'hi'
          ? 'आपका स्वागत है! स्वास्थ्य का ख्याल रखें। 🌟'
          : "You're very welcome! Wishing you great health. Feel free to ask if you need anything else! 🌟";
      } else {
        replyText = language === 'hi'
          ? 'मैं आपकी बात समझ रहा हूँ। विशिष्ट चिकित्सा सलाह के लिए हमारे विशेषज्ञ डॉक्टरों से परामर्श लें। आप नीचे दिए गए लिंक से डॉक्टरों की सूची देख सकते हैं:'
          : 'I understand. For specific clinical questions, we recommend consulting our specialists. You can check doctor timings, track live tokens, or contact reception:';
        action = { label: language === 'hi' ? 'डॉक्टरों की सूची देखें' : 'Explore Gwalior Specialists', path: '/doctors' };
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: replyText,
          action,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 550);
  };

  const prompts = language === 'hi' ? quickPromptsHi : quickPromptsEn;

  // Compute container position style (fixed coords when dragged, or default bottom/right)
  const containerStyle = (position.x !== null && position.y !== null)
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999
      }
    : {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999
      };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className="font-sans select-none transition-shadow"
    >
      {/* Position Selection Menu Popup */}
      {showPosMenu && (
        <div className="absolute bottom-full right-0 mb-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <span>{t('fixByChoice') || 'Fix Position by Choice'}</span>
            <button onClick={() => setShowPosMenu(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <button
            onClick={() => setPresetPosition('bottom-right')}
            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200"
          >
            <span>↘️ {t('posBottomRight') || 'Bottom Right'}</span>
          </button>
          <button
            onClick={() => setPresetPosition('bottom-left')}
            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200"
          >
            <span>↙️ {t('posBottomLeft') || 'Bottom Left'}</span>
          </button>
          <button
            onClick={() => setPresetPosition('top-right')}
            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200"
          >
            <span>↗️ {t('posTopRight') || 'Top Right'}</span>
          </button>
          <button
            onClick={() => setPresetPosition('top-left')}
            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200"
          >
            <span>↖️ {t('posTopLeft') || 'Top Left'}</span>
          </button>
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setPresetPosition('reset')}
              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 flex items-center gap-1.5 font-bold"
            >
              <FiRotateCcw className="text-xs" />
              <span>{t('resetPos') || 'Reset position'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button (Draggable by User Choice) */}
      {!isOpen && (
        <div
          onMouseDown={(e) => handleStartDrag(e.clientX, e.clientY, e)}
          onTouchStart={(e) => {
            if (e.touches[0]) handleStartDrag(e.touches[0].clientX, e.touches[0].clientY, e);
          }}
          onClick={() => {
            if (!hasMovedRef.current) {
              setIsOpen(true);
            }
          }}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl transition-transform duration-150 transform hover:scale-105 cursor-grab active:cursor-grabbing border-2 border-white/20 select-none"
          title={t('dragTip') || 'Drag anywhere or fix by choice'}
          aria-label="Open AI Assistant"
        >
          {/* Visual Grip Handle */}
          <div className="text-white/70 group-hover:text-white transition cursor-grab">
            <MdDragIndicator className="text-lg" />
          </div>

          <div className="relative">
            <RiRobot2Line className="text-2xl" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
              {language === 'hi' ? 'एआई सहायक 2027' : 'AI Assistant 2027'}
            </span>
            <span className="text-sm font-black">MediBot</span>
          </div>

          {/* Quick Choice / Move Menu Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPosMenu(prev => !prev);
            }}
            className="p-1 rounded-full hover:bg-white/20 text-white/70 hover:text-white text-xs ml-0.5"
            title={t('fixByChoice') || 'Fix position by choice'}
          >
            <FiSliders />
          </button>

          {position.x !== null && (
            <button
              type="button"
              onClick={handleResetPosition}
              className="p-1 rounded-full hover:bg-white/20 text-white/70 hover:text-white text-xs"
              title={t('resetPos') || 'Reset position to corner'}
            >
              <FiRotateCcw />
            </button>
          )}
        </div>
      )}

      {/* Chat Window (Draggable by Header) */}
      {isOpen && (
        <div className="w-[94vw] sm:w-[440px] h-[610px] max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-blue-500/20 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Draggable Header */}
          <div
            onMouseDown={(e) => handleStartDrag(e.clientX, e.clientY, e)}
            onTouchStart={(e) => {
              if (e.touches[0]) handleStartDrag(e.touches[0].clientX, e.touches[0].clientY, e);
            }}
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-3.5 text-white flex items-center justify-between shadow-md cursor-grab active:cursor-grabbing select-none"
            title={t('dragTip') || 'Click and drag to reposition chat window'}
          >
            <div className="flex items-center gap-2.5">
              <div className="text-white/60 hover:text-white cursor-grab">
                <MdDragIndicator className="text-xl" />
              </div>
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-lg shadow-inner">
                <RiRobot2Line />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-none">
                    {language === 'hi' ? 'मेडीबॉट एआई' : 'MediBot AI'}
                  </h3>
                  <span className="bg-emerald-400 text-emerald-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                    2027
                  </span>
                </div>
                <p className="text-[10px] text-blue-100 mt-0.5">
                  {language === 'hi' ? 'स्मार्ट क्लिनिक एवं कतार मार्गदर्शक' : 'Smart Clinic & Queue Navigator'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Fix Position by Choice Menu */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPosMenu(prev => !prev);
                }}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition"
                title={t('fixByChoice') || 'Fix position by choice'}
              >
                <FiSliders className="text-sm" />
              </button>

              {position.x !== null && (
                <button
                  type="button"
                  onClick={handleResetPosition}
                  className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition"
                  title={t('resetPos') || 'Reset position to corner'}
                >
                  <FiRotateCcw className="text-sm" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition"
                aria-label="Close Chat"
              >
                <FiX className="text-lg" />
              </button>
            </div>
          </div>

          {/* Clinical Non-Diagnostic Guardrail Notice */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <FiShield className="shrink-0 text-amber-600 text-xs" />
              <span>
                {language === 'hi'
                  ? 'प्रशासनिक व नेविगेशन सहायता हेतु। निदान के लिए डॉक्टर से जांच करवाएं।'
                  : 'For administrative guidance & queue navigation. Diagnosis requires physical doctor exam.'}
              </span>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex-shrink-0 flex items-center justify-center text-sm mt-0.5 shadow-sm">
                    <RiRobot2Line />
                  </div>
                )}
                <div className={`max-w-[84%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.action && (
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          navigate(msg.action.path);
                        }}
                        className="mt-2.5 inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl font-bold text-xs transition border border-blue-200 dark:border-blue-700"
                      >
                        <span>{msg.action.label}</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex-shrink-0 flex items-center justify-center text-sm mt-0.5 shadow-sm">
                    <FiUser />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2.5 items-center text-gray-400 text-xs">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow-sm">
                  <RiRobot2Line />
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-slate-100/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
            {prompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.query)}
                className="whitespace-nowrap bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 font-medium transition flex-shrink-0 shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={language === 'hi' ? 'डॉक्टर, कतार, फीस या तैयारी के बारे में पूछें...' : 'Ask about Gwalior doctors, tokens, prep...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />

              {/* Voice Input Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={isListening ? 'Listening...' : (language === 'hi' ? 'बोलकर पूछें (हिन्दी / अंग्रेजी)' : 'Voice Search (Hindi / English)')}
              >
                {isListening ? <FiMicOff className="text-base" /> : <FiMic className="text-base" />}
              </button>

              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition shadow-sm"
                aria-label="Send message"
              >
                <FiSend className="text-base" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1.5 px-1">
              <span>🚨 {language === 'hi' ? 'आपातकाल में 108 डायल करें।' : 'For acute trauma dial 108.'}</span>
              <span className="flex items-center gap-1 text-[9px] text-slate-400">
                <FiMove /> {t('dragTip') || 'Drag header to move'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
