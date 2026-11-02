const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
require('dotenv').config();

const sampleDoctors = [
  // 1. CARDIOLOGY (HEART SPECIALISTS)
  {
    name: 'Dr. Akash Modi',
    specialization: 'Cardiologist',
    clinic: 'Shreenath Heart Care & Sahara Hospital',
    address: 'Panchwati Nagar, Roshni Ghar Road, Near Achaleshwar Mandir, Lashkar, Gwalior, MP',
    email: 'dr.akashmodi@gwaliorheart.in',
    phone: '9826210001',
    profileImage: '',
    rating: 4.9,
    reviewCount: 248,
    reviews: [
      {
        name: 'Rameshwar Singh Tomar',
        rating: 5,
        comment: 'Best cardiologist in Gwalior. Treated my mother with immense care and dedication.',
        imageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        name: 'Sunita Sharma',
        rating: 5,
        comment: 'Very polite, detailed ECG and Echo analysis. Highly recommended for cardiac patients.',
        imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    ],
    experience: 18,
    timings: {
      start: '10:00',
      end: '19:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Prateek Singh Bhadauria',
    specialization: 'Cardiologist',
    clinic: 'Pariniti Heart Centre',
    address: 'Near Madhav Dispensary, Govindpuri, Gwalior, MP',
    email: 'dr.prateekbhadauria@cardio.in',
    phone: '9826312450',
    profileImage: '',
    rating: 4.8,
    reviewCount: 186,
    reviews: [
      {
        name: 'Devendra Kushwaha',
        rating: 5,
        comment: 'Accurate diagnosis for hypertension and chest discomfort. Very honest doctor.',
        imageUrl: 'https://randomuser.me/api/portraits/men/45.jpg'
      }
    ],
    experience: 21,
    timings: {
      start: '11:00',
      end: '20:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Nishant Gangil',
    specialization: 'Cardiologist',
    clinic: 'Advanced Heart Care Clinic',
    address: 'Opposite Kalyan Multi-Speciality Hospital, Padav, Gwalior, MP',
    email: 'dr.nishantgangil@heartcare.org',
    phone: '9826541203',
    profileImage: '',
    rating: 4.7,
    reviewCount: 142,
    reviews: [
      {
        name: 'Anil Agarwal',
        rating: 5,
        comment: 'Great guidance on preventive cardiology and lifestyle management.',
        imageUrl: 'https://randomuser.me/api/portraits/men/51.jpg'
      }
    ],
    experience: 15,
    timings: {
      start: '10:30',
      end: '18:30'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },

  // 2. ORTHOPEDICS & SPINE (BONE & JOINT)
  {
    name: 'Dr. Vipin Garg',
    specialization: 'Orthopedic Surgeon',
    clinic: 'KLM Spine Clinic',
    address: 'Saraswati Nagar, University Road, Near Govindpuri, Gwalior, MP',
    email: 'dr.vipingarg@klmspine.com',
    phone: '9826012489',
    profileImage: '',
    rating: 4.9,
    reviewCount: 312,
    reviews: [
      {
        name: 'Manoj Batham',
        rating: 5,
        comment: 'Exceptional spine and back pain treatment. Cured my sciatica without surgery!',
        imageUrl: 'https://randomuser.me/api/portraits/men/29.jpg'
      },
      {
        name: 'Pooja Saxena',
        rating: 5,
        comment: 'One of the best spine and joint replacement specialists in MP.',
        imageUrl: 'https://randomuser.me/api/portraits/women/28.jpg'
      }
    ],
    experience: 18,
    timings: {
      start: '10:00',
      end: '18:30'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Devesh Bandil',
    specialization: 'Orthopedic Surgeon',
    clinic: 'Dr. Suresh Bandil Memorial Orthopaedic & Maternity Center',
    address: 'Kampoo Road, Shinde Ki Chhawani, Gwalior, MP',
    email: 'dr.deveshbandil@bandilortho.com',
    phone: '9827034112',
    profileImage: '',
    rating: 4.8,
    reviewCount: 274,
    reviews: [
      {
        name: 'Harish Parihar',
        rating: 5,
        comment: 'Excellent knee joint consultation and compassionate demeanor.',
        imageUrl: 'https://randomuser.me/api/portraits/men/63.jpg'
      }
    ],
    experience: 22,
    timings: {
      start: '10:00',
      end: '19:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Himanshu Kushwah',
    specialization: 'Orthopedic Surgeon',
    clinic: 'Kushwah Ortho Clinic',
    address: 'Opposite Sector 2 Gate, Deen Dayal Nagar, Gwalior, MP',
    email: 'dr.himanshukushwah@orthoclinic.in',
    phone: '9826223456',
    profileImage: '',
    rating: 4.8,
    reviewCount: 168,
    reviews: [
      {
        name: 'Neeraj Dubey',
        rating: 5,
        comment: 'Fixed my ankle fracture smoothly. Very attentive to recovery post-op.',
        imageUrl: 'https://randomuser.me/api/portraits/men/38.jpg'
      }
    ],
    experience: 16,
    timings: {
      start: '11:00',
      end: '20:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Sparsh Jain',
    specialization: 'Orthopedic Surgeon',
    clinic: 'Sparsh Ortho Care',
    address: 'Near Anand Talkies, Vinay Nagar, Gwalior, MP',
    email: 'dr.sparshjain@orthocare.com',
    phone: '9827156789',
    profileImage: '',
    rating: 4.7,
    reviewCount: 115,
    reviews: [
      {
        name: 'Vivek Rawat',
        rating: 5,
        comment: 'Young and dynamic surgeon, modern sports injury treatment.',
        imageUrl: 'https://randomuser.me/api/portraits/men/19.jpg'
      }
    ],
    experience: 10,
    timings: {
      start: '10:30',
      end: '18:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday']
  },

  // 3. OBSTETRICS & GYNECOLOGY (WOMEN'S HEALTH)
  {
    name: 'Dr. Nita Johri',
    specialization: 'Obstetrician & Gynecologist',
    clinic: 'Deepak Johri Nursing Home',
    address: 'Patel Nagar, Near City Center, Gwalior, MP',
    email: 'dr.nitajohri@johridentalnursing.com',
    phone: '9826045612',
    profileImage: 'https://images.unsplash.com/photo-1594824813682-12be5fce3be9?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviewCount: 356,
    reviews: [
      {
        name: 'Shweta Shrivastava',
        rating: 5,
        comment: 'Blessed with normal delivery under Dr. Nita Johri ma’am. Extremely grateful!',
        imageUrl: 'https://randomuser.me/api/portraits/women/62.jpg'
      },
      {
        name: 'Rashmi Bhargava',
        rating: 5,
        comment: 'Most trusted gynecologist in Gwalior. Very kind and reassuring.',
        imageUrl: 'https://randomuser.me/api/portraits/women/55.jpg'
      }
    ],
    experience: 28,
    timings: {
      start: '10:30',
      end: '19:30'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Prabha Gupta',
    specialization: 'Obstetrician & Gynecologist',
    clinic: 'Prabha Nursing Home',
    address: 'Daulat Ganj, Lashkar, Gwalior, MP',
    email: 'dr.prabhagupta@nursinghome.in',
    phone: '9826198765',
    profileImage: '',
    rating: 4.9,
    reviewCount: 320,
    reviews: [
      {
        name: 'Arti Tiwari',
        rating: 5,
        comment: 'Senior-most respected gynecologist in Lashkar. Vast experience.',
        imageUrl: 'https://randomuser.me/api/portraits/women/33.jpg'
      }
    ],
    experience: 26,
    timings: {
      start: '10:00',
      end: '18:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Rachna Dogra',
    specialization: 'Obstetrician & Gynecologist',
    clinic: 'Dogra Clinic',
    address: 'Near Kalka Mata Mandir, Lashkar, Gwalior, MP',
    email: 'dr.rachnadogra@dograclinic.in',
    phone: '9826278901',
    profileImage: '',
    rating: 4.8,
    reviewCount: 210,
    reviews: [
      {
        name: 'Garima Verma',
        rating: 5,
        comment: 'Superb care during prenatal and postnatal checkups.',
        imageUrl: 'https://randomuser.me/api/portraits/women/48.jpg'
      }
    ],
    experience: 20,
    timings: {
      start: '11:00',
      end: '19:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Sonali Agrawal',
    specialization: 'Obstetrician & Gynecologist',
    clinic: 'New Life Maternity Clinic',
    address: 'Mahatma Gandhi Road, Thatipur, Gwalior, MP',
    email: 'dr.sonaliagrawal@newlifegwalior.com',
    phone: '9826389012',
    profileImage: '',
    rating: 4.7,
    reviewCount: 154,
    reviews: [
      {
        name: 'Deepika Yadav',
        rating: 5,
        comment: 'Wonderful doctor for high-risk pregnancy. Explains everything patiently.',
        imageUrl: 'https://randomuser.me/api/portraits/women/27.jpg'
      }
    ],
    experience: 15,
    timings: {
      start: '10:00',
      end: '18:30'
    },
    availableDays: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },

  // 4. DERMATOLOGY (SKIN, HAIR & AESTHETICS)
  {
    name: 'Dr. Shivansh Kanchan',
    specialization: 'Dermatologist',
    clinic: 'Siddhi Skin Hair & Laser Clinic',
    address: 'Naya Bazar, Lashkar, Gwalior, MP',
    email: 'dr.shivanshkanchan@siddhiskin.com',
    phone: '9826501234',
    profileImage: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviewCount: 198,
    reviews: [
      {
        name: 'Gaurav Rathore',
        rating: 5,
        comment: 'Cleansed my chronic acne issue in 2 months. Best skin clinic in Naya Bazar.',
        imageUrl: 'https://randomuser.me/api/portraits/men/24.jpg'
      }
    ],
    experience: 12,
    timings: {
      start: '10:30',
      end: '19:30'
    },
    availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Deepak Argal',
    specialization: 'Dermatologist',
    clinic: "Dr. Deepak's Skin & Hair Clinic",
    address: 'Near Mayur Plaza, Indramani Nagar, Gwalior, MP',
    email: 'dr.deepakargal@skinclinic.in',
    phone: '9826490123',
    profileImage: '',
    rating: 4.8,
    reviewCount: 235,
    reviews: [
      {
        name: 'Sadhana Dixit',
        rating: 5,
        comment: 'Very effective hair loss and skin allergy treatment. Polite staff.',
        imageUrl: 'https://randomuser.me/api/portraits/women/65.jpg'
      }
    ],
    experience: 14,
    timings: {
      start: '11:00',
      end: '20:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Dhruv Premy Agarwal',
    specialization: 'Dermatologist',
    clinic: 'Premy Hair, Skin And Laser Clinic',
    address: 'Sarafa Bazar, Lashkar, Gwalior, MP',
    email: 'dr.dhruvpremy@premyskin.in',
    phone: '9826612345',
    profileImage: '',
    rating: 4.7,
    reviewCount: 172,
    reviews: [
      {
        name: 'Rohit Chauhan',
        rating: 5,
        comment: 'Advanced laser equipment and genuine clinical advice without overcharging.',
        imageUrl: 'https://randomuser.me/api/portraits/men/71.jpg'
      }
    ],
    experience: 16,
    timings: {
      start: '11:00',
      end: '19:30'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Triveni Harode',
    specialization: 'Dermatologist',
    clinic: 'Triveni Kidney Skin 360 Clinic',
    address: 'Opposite Achaleshwar Temple, Lashkar, Gwalior, MP',
    email: 'dr.triveniharode@skin360.in',
    phone: '9826723456',
    profileImage: '',
    rating: 4.8,
    reviewCount: 150,
    reviews: [
      {
        name: 'Monika Khandelwal',
        rating: 5,
        comment: 'Compassionate approach for eczema and pigmentation.',
        imageUrl: 'https://randomuser.me/api/portraits/women/36.jpg'
      }
    ],
    experience: 13,
    timings: {
      start: '10:00',
      end: '18:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },

  // 5. PEDIATRICS (CHILD SPECIALISTS)
  {
    name: 'Dr. Manish Kuber',
    specialization: 'Pediatrician',
    clinic: 'Kuber Bal Chikitsalaya',
    address: '7 No. Chauraha, Morar, Gwalior, MP',
    email: 'dr.manishkuber@kuberpediatrics.in',
    phone: '9826834567',
    profileImage: '',
    rating: 4.9,
    reviewCount: 295,
    reviews: [
      {
        name: 'Satish Sen',
        rating: 5,
        comment: 'He has been our family child doctor for years. Handles babies with utmost love.',
        imageUrl: 'https://randomuser.me/api/portraits/men/42.jpg'
      }
    ],
    experience: 20,
    timings: {
      start: '09:30',
      end: '19:30'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Praveen Kumar Garg',
    specialization: 'Pediatrician',
    clinic: 'Prayaas Children Hospital',
    address: 'Near Phoolbagh, Lashkar, Gwalior, MP',
    email: 'dr.praveengarg@prayaaschildren.com',
    phone: '9826945678',
    profileImage: '',
    rating: 4.8,
    reviewCount: 228,
    reviews: [
      {
        name: 'Priyanka Shakya',
        rating: 5,
        comment: 'Saved our newborn in NICU. We will always remain indebted to Dr. Praveen Garg.',
        imageUrl: 'https://randomuser.me/api/portraits/women/19.jpg'
      }
    ],
    experience: 19,
    timings: {
      start: '10:00',
      end: '19:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Naresh Agrawal',
    specialization: 'Pediatrician',
    clinic: 'Dr. Naresh Agrawal Child Clinic',
    address: 'Main Road, Balwant Nagar, Thatipur, Gwalior, MP',
    email: 'dr.nareshagrawal@childclinic.in',
    phone: '9826056789',
    profileImage: '',
    rating: 4.8,
    reviewCount: 194,
    reviews: [
      {
        name: 'Rajat Sharma',
        rating: 5,
        comment: 'Very polite with kids, gives minimum required medicine. Best in Thatipur.',
        imageUrl: 'https://randomuser.me/api/portraits/men/26.jpg'
      }
    ],
    experience: 24,
    timings: {
      start: '10:00',
      end: '19:30'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },

  // 6. GENERAL MEDICINE (INTERNAL MEDICINE & DIABETOLOGY)
  {
    name: 'Dr. Jitendra Satpute',
    specialization: 'General Physician',
    clinic: 'Satpute Health Clinic',
    address: 'Near MLB College, Lashkar, Gwalior, MP',
    email: 'dr.jitendrasatpute@healthclinic.in',
    phone: '9826167890',
    profileImage: '',
    rating: 4.8,
    reviewCount: 245,
    reviews: [
      {
        name: 'Bhupendra Lodhi',
        rating: 5,
        comment: 'Quick and accurate diagnosis of viral and seasonal illnesses.',
        imageUrl: 'https://randomuser.me/api/portraits/men/58.jpg'
      }
    ],
    experience: 18,
    timings: {
      start: '09:30',
      end: '19:30'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Parag Srivastava',
    specialization: 'General Physician',
    clinic: 'Dr. Parag Srivastava Clinic',
    address: 'Vivekanand Needle Factory Road, Thatipur, Gwalior, MP',
    email: 'dr.paragsrivastava@clinicgwl.in',
    phone: '9826278912',
    profileImage: '',
    rating: 4.9,
    reviewCount: 326,
    reviews: [
      {
        name: 'Ashok Gupta',
        rating: 5,
        comment: 'Renowned physician with vast diagnostic acumen. Highly respected.',
        imageUrl: 'https://randomuser.me/api/portraits/men/66.jpg'
      }
    ],
    experience: 26,
    timings: {
      start: '10:00',
      end: '20:30'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Akash Gour',
    specialization: 'General Physician',
    clinic: 'Sparsh Health Care Clinic',
    address: 'Gole Ka Mandir, Near Airport Road, Gwalior, MP',
    email: 'dr.akashgour@sparshgwl.com',
    phone: '9826389123',
    profileImage: '',
    rating: 4.7,
    reviewCount: 135,
    reviews: [
      {
        name: 'Kamlesh Kushwah',
        rating: 5,
        comment: 'Friendly doctor, takes time to understand full history. Good consultation fee.',
        imageUrl: 'https://randomuser.me/api/portraits/men/15.jpg'
      }
    ],
    experience: 12,
    timings: {
      start: '10:00',
      end: '19:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },

  // 7. OPHTHALMOLOGY (EYE SURGEONS)
  {
    name: 'Dr. Manav Setiya',
    specialization: 'Ophthalmologist',
    clinic: 'Jeevan Jyoti Netralaya',
    address: 'Jayendraganj, Lashkar, Gwalior, MP',
    email: 'dr.manavsetiya@jeevanjyotieye.com',
    phone: '9826490234',
    profileImage: '',
    rating: 4.9,
    reviewCount: 290,
    reviews: [
      {
        name: 'Suresh Chandra Jain',
        rating: 5,
        comment: 'Did my father’s cataract surgery with advanced lens. Perfect crystal clear vision!',
        imageUrl: 'https://randomuser.me/api/portraits/men/72.jpg'
      }
    ],
    experience: 23,
    timings: {
      start: '10:00',
      end: '19:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Vijay K. Ahuja',
    specialization: 'Ophthalmologist',
    clinic: 'Divya Drishti Netralaya & Laser Centre',
    address: 'Naya Bazar, Lashkar, Gwalior, MP',
    email: 'dr.vijayahuja@divyadrishti.in',
    phone: '9826501345',
    profileImage: '',
    rating: 4.8,
    reviewCount: 230,
    reviews: [
      {
        name: 'Tarun Mathur',
        rating: 5,
        comment: '30 years of trust. Highly competent eye surgeon.',
        imageUrl: 'https://randomuser.me/api/portraits/men/47.jpg'
      }
    ],
    experience: 30,
    timings: {
      start: '10:30',
      end: '19:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },

  // 8. ENT SPECIALISTS (EAR, NOSE & THROAT)
  {
    name: 'Dr. Rahul Agrawal',
    specialization: 'ENT Specialist',
    clinic: 'Agrawal Hospital And Research Institute',
    address: 'Hospital Road, Lashkar, Gwalior, MP',
    email: 'dr.rahulagrawal@agrawalhospital.in',
    phone: '9826612456',
    profileImage: '',
    rating: 4.9,
    reviewCount: 305,
    reviews: [
      {
        name: 'Deepak Kulshrestha',
        rating: 5,
        comment: 'Top ENT specialist in Gwalior. Resolved my chronic sinus problem permanently.',
        imageUrl: 'https://randomuser.me/api/portraits/men/35.jpg'
      }
    ],
    experience: 24,
    timings: {
      start: '10:00',
      end: '19:30'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    name: 'Dr. Navin Shukla',
    specialization: 'ENT Specialist',
    clinic: 'Vaibhav Memorial Hospital',
    address: 'Vijay Nagar Extension, Lashkar, Gwalior, MP',
    email: 'dr.navinshukla@vaibhavhospital.org',
    phone: '9826723567',
    profileImage: '',
    rating: 4.8,
    reviewCount: 215,
    reviews: [
      {
        name: 'Vijay Singhal',
        rating: 5,
        comment: 'Careful endoscopy and treatment for throat allergy and vocal hoarseness.',
        imageUrl: 'https://randomuser.me/api/portraits/men/41.jpg'
      }
    ],
    experience: 23,
    timings: {
      start: '11:00',
      end: '19:30'
    },
    availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday']
  },

  // 9. NEUROLOGY (BRAIN & SPINE)
  {
    name: 'Dr. Abhishek Chauhan',
    specialization: 'Neurologist',
    clinic: 'Neuro Care Clinic & Brain Spine Institute',
    address: 'Near Kampoo, City Center Extension, Gwalior, MP',
    email: 'dr.abhishekchauhan@neurocare.in',
    phone: '9826834678',
    profileImage: '',
    rating: 4.8,
    reviewCount: 182,
    reviews: [
      {
        name: 'Pradeep Chandel',
        rating: 5,
        comment: 'Super specialist for migraine and nerve pain. Very scientific treatment approach.',
        imageUrl: 'https://randomuser.me/api/portraits/men/53.jpg'
      }
    ],
    experience: 16,
    timings: {
      start: '11:00',
      end: '20:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday']
  }
];

// Generate doctor user login accounts dynamically for every doctor in sampleDoctors
const sampleDoctorUsers = sampleDoctors.map((doc) => ({
  name: doc.name,
  email: doc.email,
  password: 'doctor123',
  role: 'doctor',
  phone: doc.phone
}));

const adminUser = {
  name: 'System Administrator',
  email: 'admin@clinic.com',
  password: 'admin123',
  role: 'admin',
  phone: '9876543210'
};

async function seedDatabase(options = {}) {
  const shouldClose = options.closeConnection !== false && require.main === module;
  try {
    const mongoUri = options.uri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/queue_database';
    const isLocal = !mongoUri || mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');
    
    if (mongoose.connection.readyState !== 1) {
      const connectOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 8000
      };

      if (!isLocal) {
        connectOptions.retryWrites = true;
        connectOptions.w = 'majority';
        connectOptions.tls = true;
        connectOptions.tlsAllowInvalidCertificates = true;
        connectOptions.ssl = true;
      }

      await mongoose.connect(mongoUri, connectOptions);
      console.log('Connected to MongoDB for seeding');
    }

    const skipClear = options.skipClear ?? (process.env.SKIP_CLEAR === 'true');
    
    if (!skipClear) {
      // Clear existing doctor records to refresh with real Gwalior doctor dataset
      await Doctor.deleteMany({});
      await User.deleteMany({ role: 'doctor' });
      console.log('Cleared previous doctor records & doctor logins');
    } else {
      console.log('Skipping data clear');
    }

    // Insert admin user (only if doesn't exist)
    const adminExists = await User.findOne({ email: adminUser.email });
    if (!adminExists) {
      await User.create(adminUser);
      console.log('Admin user added successfully');
    } else {
      console.log('Admin user already exists, keeping...');
    }

    // Insert real Gwalior doctors
    for (const doctor of sampleDoctors) {
      const exists = await Doctor.findOne({ email: doctor.email });
      if (!exists) {
        await Doctor.create(doctor);
      }
    }
    console.log(`Seeded ${sampleDoctors.length} real Gwalior doctors across 9 medical specializations.`);

    // Insert doctor user logins (avoid duplicates)
    for (const doctorUser of sampleDoctorUsers) {
      const exists = await User.findOne({ email: doctorUser.email });
      if (!exists) {
        await User.create(doctorUser);
      }
    }
    console.log(`Ensured login credentials for all ${sampleDoctorUsers.length} Gwalior doctor accounts (Password: doctor123).`);

    console.log('Gwalior real doctor database seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  } finally {
    if (shouldClose && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleDoctors, sampleDoctorUsers, adminUser };
