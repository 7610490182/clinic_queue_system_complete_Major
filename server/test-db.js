require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clinic-queue';
  console.log('Testing MongoDB connection to:', uri.replace(/:([^:@]+)@/, ':****@'));

  try {
    const isLocal = !uri || uri.includes('127.0.0.1') || uri.includes('localhost');
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    };

    if (!isLocal) {
      options.tls = true;
      options.tlsAllowInvalidCertificates = true;
    }

    await mongoose.connect(uri, options);
    console.log('✅ Connection Successful!');
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    console.log('Database Name:', mongoose.connection.name);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections present:', collections.map(c => c.name));

    await mongoose.disconnect();
    console.log('Connection closed cleanly.');
  } catch (error) {
    console.error('❌ Connection Failed:', error.message);
  }
}

testConnection();

