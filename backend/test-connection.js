require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('[test] Connecting to MongoDB...');
    console.log('[test] URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':***@'));
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[test] SUCCESS: Connected to MongoDB!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[test] FAILED:', err.message);
    console.error('[test] Full error:', err);
    process.exit(1);
  }
}

testConnection();
