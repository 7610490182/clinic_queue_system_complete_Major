const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

// Load environment variables (from server/.env and root .env)
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const paymentRoutes = require('./routes/payments');
const userRoutes = require('./routes/users');
const queueRoutes = require('./routes/queue');
const telemedicineRoutes = require('./routes/telemedicine');
const recordsRoutes = require('./routes/records');
const fhirRoutes = require('./routes/fhir');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5000',
  'https://clinic-queue-system-complete-major.onrender.com',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com') || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
};

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

const { seedDatabase } = require('./seed');
let persistentMongoServer = null;

// Ensure local persistent data directory exists
const dataDir = path.join(__dirname, 'data', 'db');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper to launch local persistent MongoDB 8.2 WiredTiger instance
const startLocalPersistentMongo = async () => {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    persistentMongoServer = await MongoMemoryServer.create({
      instance: {
        dbPath: dataDir,
        port: 27017,
        storageEngine: 'wiredTiger'
      }
    });

    const targetDbName = process.env.MONGO_URI
      ? (process.env.MONGO_URI.split('/').pop().split('?')[0] || 'queue_database')
      : 'queue_database';
    const baseUri = persistentMongoServer.getUri().replace(/\/?$/, '/');
    const activeUri = baseUri + targetDbName;
    console.log(`[MongoDB] Persistent MongoDB Service active on port 27017`);
    console.log(`[MongoDB] Connection URI: ${activeUri}`);

    await mongoose.connect(activeUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`[MongoDB] Connected to persistent MongoDB at ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);

    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[MongoDB] Seeding initial demo doctors and admin...');
      await seedDatabase({ skipClear: true, closeConnection: false });
    }
    console.log('[MongoDB] Database ready! All clinic collections are permanently preserved on disk.');
  } catch (persistentErr) {
    console.error('[MongoDB] Failed to start persistent MongoDB instance:', persistentErr.message);
    process.exit(1);
  }
};

// Connect to MongoDB (Local, Persistent Instance, or MongoDB Atlas Cloud)
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/queue_database';
  const isLocal = !uri || uri.includes('127.0.0.1') || uri.includes('localhost');

  const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: isLocal ? 5000 : 15000
  };

  if (!isLocal) {
    connectOptions.tls = true;
    connectOptions.tlsAllowInvalidCertificates = true;
  }

  try {
    console.log(`[MongoDB] Connecting to database: ${uri.replace(/:([^:@]+)@/, ':****@')} ...`);
    await mongoose.connect(uri, connectOptions);
    console.log(`[MongoDB] Successfully connected to MongoDB at ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);

    // Ensure all verified doctors and standard demo accounts are ready
    try {
      console.log('[MongoDB] Ensuring clinic doctors and standard demo login accounts...');
      await seedDatabase({ skipClear: true, closeConnection: false });
    } catch (seedErr) {
      console.warn('[MongoDB] Seeding verification notice:', seedErr.message);
    }
  } catch (err) {
    if (isLocal) {
      console.warn(`[MongoDB] Standalone MongoDB daemon is not running on port 27017 (${err.message}).`);
      console.log(`[MongoDB] Launching dedicated persistent MongoDB 8.2 WiredTiger instance (Data Directory: ${dataDir}) ...`);
      await startLocalPersistentMongo();
    } else {
      console.warn(`[MongoDB] Failed to connect to remote MongoDB Atlas (${err.message}).`);
      console.log(`[MongoDB] Falling back to local persistent MongoDB 8.2 instance so clinic operations continue seamlessly...`);
      await startLocalPersistentMongo();
    }
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('\n[Server] Shutting down gracefully...');
  try {
    await mongoose.disconnect();
    console.log('[MongoDB] Mongoose connection closed.');
  } catch (e) {}

  if (persistentMongoServer) {
    try {
      await persistentMongoServer.stop();
      console.log('[MongoDB] Persistent MongoDB server stopped safely.');
    } catch (e) {}
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.once('SIGUSR2', shutdown);

connectDB();

// Health & Database status endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    database: {
      status: states[dbState] || 'unknown',
      name: mongoose.connection.name || 'clinic-queue',
      host: mongoose.connection.host,
      port: mongoose.connection.port
    },
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/telemedicine', telemedicineRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/fhir', fhirRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static client build (production / Render web service deployment)
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  console.log('[Server] Serving production static assets from:', clientDistPath);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Doctor = require('./models/Doctor');

// Socket.io JWT authentication & connection authorization middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    // Allow unauthenticated connection for public queue display only
    socket.user = null;
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'clinic-queue-jwt-default-secret-key-2026';
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user || user.isActive === false) {
      return next(new Error('Authentication failed or account deactivated'));
    }

    socket.user = user;
    if (user.role === 'doctor') {
      socket.doctor = await Doctor.findOne({ email: user.email });
    }
    next();
  } catch (err) {
    return next(new Error('Invalid socket authentication token'));
  }
});

// Socket.io for real-time updates with room & WebRTC support
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id, socket.user ? `[User: ${socket.user.email} (${socket.user.role})]` : '[Public/Guest]');

  socket.on('join', (room) => {
    if (!room) return;

    // Room Authorization Guard: Protect private doctor, patient, and admin channels
    if (room.startsWith('doctor_')) {
      const targetDoctorId = room.replace('doctor_', '');
      const isDoctor = socket.user?.role === 'doctor' && socket.doctor && String(socket.doctor._id) === targetDoctorId;
      const isAdmin = socket.user?.role === 'admin';
      if (!isDoctor && !isAdmin) {
        socket.emit('error', { message: 'Unauthorized: Cannot join private doctor room' });
        return;
      }
    }

    if (room.startsWith('patient_')) {
      const targetPatientId = room.replace('patient_', '');
      const isOwner = socket.user && String(socket.user._id) === targetPatientId;
      const isStaff = socket.user && (socket.user.role === 'admin' || socket.user.role === 'doctor');
      if (!isOwner && !isStaff) {
        socket.emit('error', { message: 'Unauthorized: Cannot join private patient room' });
        return;
      }
    }

    if (room.startsWith('admin')) {
      if (!socket.user || socket.user.role !== 'admin') {
        socket.emit('error', { message: 'Unauthorized: Cannot join private admin room' });
        return;
      }
    }

    socket.join(room);
    console.log(`Socket ${socket.id} (${socket.user?.role || 'guest'}) joined room: ${room}`);
  });

  // Feature 5: WebRTC Telemedicine Signaling
  socket.on('telemed:join', ({ roomId, userId, userName, role }) => {
    socket.join(roomId);
    console.log(`User ${userName} (${role}) joined telemed room ${roomId}`);
    socket.to(roomId).emit('telemed:user_joined', { userId, userName, role });
  });

  socket.on('telemed:signal', ({ roomId, signal, sender }) => {
    socket.to(roomId).emit('telemed:signal', { signal, sender });
  });

  socket.on('telemed:chat', ({ roomId, message, sender, senderRole }) => {
    io.to(roomId).emit('telemed:chat', {
      message,
      sender,
      senderRole,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible in routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
